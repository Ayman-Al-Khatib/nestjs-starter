import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { buildBaileysAuthState } from '../utils/baileys-auth-state.util';
import {
  PERSONAL_CHAT_JID_SUFFIX,
  QR_WAIT_TIMEOUT_MS,
  WA_DEVICE_LABEL,
} from '../utils/whatsapp.constants';
import { WhatsappAuthService } from './whatsapp-auth.service';

/**
 * Pending caller waiting for the next QR code Baileys emits. We keep a list
 * because two admins may hit `/qr` while we're still booting the socket.
 */
type QrWaiter = {
  resolve: (qr: string) => void;
  reject: (err: Error) => void;
  timeout: NodeJS.Timeout;
};

/**
 * Owns the lifecycle of the Baileys WebSocket and exposes the small surface
 * the rest of the app needs:
 *
 *   - `getQrBase64()` — boot a fresh socket and return the next QR as a PNG
 *                       data-URL. Used by the admin pairing flow.
 *   - `sendText()`    — fire a text message to a phone number.
 *   - `logout()`      — unpair from WhatsApp and wipe local credentials so a
 *                       different number can pair next.
 *   - `isConnected()` — non-throwing connection probe (for `/status`).
 *
 * Why a single class: the lifecycle (start ↔ event-handler ↔ teardown) is
 * tightly coupled to one socket instance, splitting it across classes only
 * adds plumbing without a clear seam.
 */
@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);

  private sock: any = null;
  private connected = false;
  private latestQr: string | null = null;
  private startPromise: Promise<void> | null = null;
  private waiters: QrWaiter[] = [];

  constructor(private readonly authStore: WhatsappAuthService) {}

  // ───────────────────────────────────────────────────────────
  //  Lifecycle hooks
  // ───────────────────────────────────────────────────────────

  /**
   * Eagerly boot the socket when the app starts so a previously-paired
   * session re-attaches without waiting for the first inbound request.
   * The `stub` driver mode skips this entirely.
   */
  onModuleInit(): void {
    if (process.env.WHATSAPP_DRIVER === 'baileys') {
      void this.ensureSocket();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.teardown({ removeAuth: false });
  }

  // ───────────────────────────────────────────────────────────
  //  Public API
  // ───────────────────────────────────────────────────────────

  /**
   * Return the next QR code as a `data:image/png;base64,...` URL.
   *
   * Behaviour:
   *  - If the session is already connected, this is a 409 — pairing makes
   *    no sense and we don't want to surprise-rotate the linked device.
   *  - If we already have a cached QR (still valid), return it.
   *  - Otherwise, kick the socket if needed and wait up to
   *    `QR_WAIT_TIMEOUT_MS` for Baileys to emit one.
   */
  async getQrBase64(): Promise<string> {
    if (this.connected) {
      throw new ConflictException('WhatsApp session is already connected.');
    }

    await this.ensureSocket();

    const qrString = this.latestQr ?? (await this.waitForQr());
    return QRCode.toDataURL(qrString);
  }

  /** Send a plain-text message. Throws 503 when the socket isn't open. */
  async sendText(phone: string, text: string): Promise<string> {
    if (!this.connected || !this.sock) {
      throw new ServiceUnavailableException('WhatsApp is not connected.');
    }
    const jid = this.toJid(phone);
    const result = await this.sock.sendMessage(jid, { text });
    return result?.key?.id ?? 'unknown';
  }

  /**
   * Cleanly unpair the current WhatsApp account and wipe local credentials
   * so the next `/qr` call starts a fresh pairing flow (possibly with a
   * different phone number).
   *
   * We try `sock.logout()` first to notify WhatsApp's servers — that removes
   * the linked-device entry on the user's phone. If the socket is already
   * dead we just delete the file: WhatsApp will eventually expire the
   * device-link on its own.
   */
  async logout(): Promise<void> {
    if (this.sock && this.connected) {
      try {
        await this.sock.logout();
      } catch (err) {
        // Network glitch is OK — we'll still purge persisted state below.
        this.logger.warn(`sock.logout() failed: ${(err as Error).message}`);
      }
    }
    await this.teardown({ removeAuth: true });
  }

  /** Non-throwing connection probe for `/status`. */
  isConnected(): boolean {
    return this.connected;
  }

  /** True when a paired session is persisted in remote storage. */
  isPaired(): Promise<boolean> {
    return this.authStore.exists();
  }

  // ───────────────────────────────────────────────────────────
  //  Socket lifecycle
  // ───────────────────────────────────────────────────────────

  /** Idempotent: starts the socket once even under concurrent callers. */
  private async ensureSocket(): Promise<void> {
    if (this.sock || this.startPromise) {
      return this.startPromise ?? undefined;
    }

    this.startPromise = this.startSocket().finally(() => {
      this.startPromise = null;
    });

    await this.startPromise;
  }

  private async startSocket(): Promise<void> {
    // Baileys is ESM-only. TypeScript with "module: commonjs" compiles
    // `await import(...)` into `require()`, which breaks ESM packages.
    // The Function wrapper forces a true runtime dynamic import that
    // bypasses the TypeScript→CJS transform.
    //
    // The unreachable `require.resolve` below is never executed at runtime
    // (the global is undefined) but is required so Vercel's static bundle
    // analyzer sees the dependency and ships `node_modules/@whiskeysockets/baileys`
    // with the deployment. Without it, the bundler tree-shakes the package
    // and the dynamic import fails with ERR_MODULE_NOT_FOUND.
    if ((globalThis as any).__vercelStaticAnalysis) {
      require.resolve('@whiskeysockets/baileys');
    }

    const baileys: any = await (new Function('m', 'return import(m)')(
      '@whiskeysockets/baileys',
    ) as Promise<any>);
    const makeWASocket = baileys.default ?? baileys.makeWASocket;
    const { fetchLatestBaileysVersion, Browsers, DisconnectReason } = baileys;

    const { state, saveCreds } = await buildBaileysAuthState(baileys, this.authStore);

    // Pin to the latest known-good WA Web protocol version; fall back to
    // Baileys' bundled default if WhatsApp's CDN is unreachable.
    let version: [number, number, number] | undefined;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      version = undefined;
    }

    this.sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: Browsers?.macOS('Desktop') ?? WA_DEVICE_LABEL,
      logger: this.buildSilentLogger(),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
    });

    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('connection.update', (update: any) =>
      this.handleConnectionUpdate(update, DisconnectReason),
    );
  }

  /**
   * Routes Baileys connection events. Three states matter:
   *   - new `qr`         → cache it and resolve pending waiters
   *   - `connection: open`   → mark connected, reject stale QR waiters
   *   - `connection: close`  → reject waiters and either purge (loggedOut)
   *                            or reconnect (transient drop)
   */
  private handleConnectionUpdate(update: any, DisconnectReason: any): void {
    const { connection, qr, lastDisconnect } = update ?? {};

    if (qr) {
      this.latestQr = qr;
      this.resolveWaiters(qr);
    }

    if (connection === 'open') {
      this.connected = true;
      this.latestQr = null;
      this.rejectWaiters(
        new ConflictException('WhatsApp session is connected; no QR is needed now.'),
      );
      this.logger.log('WhatsApp socket connected.');
    }

    if (connection === 'close') {
      this.connected = false;
      this.latestQr = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      this.rejectWaiters(
        new ServiceUnavailableException(
          `Connection closed${statusCode ? ` (${statusCode})` : ''}.`,
        ),
      );

      // User unlinked the device on their phone — clear persisted creds so
      // the next pairing isn't trying to re-attach a dead session.
      if (statusCode === DisconnectReason.loggedOut) {
        this.logger.warn('WhatsApp session logged out remotely — wiping persisted creds.');
        this.teardown({ removeAuth: true }).catch((err) =>
          this.logger.warn(`teardown after remote logout failed: ${(err as Error).message}`),
        );
        return;
      }

      // Any other drop (network, server restart) — try to come back up.
      this.restartSocket().catch((err) =>
        this.logger.warn(`restartSocket failed: ${(err as Error).message}`),
      );
    }
  }

  private async restartSocket(): Promise<void> {
    await this.teardown({ removeAuth: false });
    await this.ensureSocket();
  }

  /**
   * Drop the socket, clear in-memory state and (optionally) wipe persisted
   * creds. Pending QR waiters are always rejected so HTTP callers don't
   * hang past this point.
   */
  private async teardown({ removeAuth }: { removeAuth: boolean }): Promise<void> {
    if (this.sock) {
      try {
        this.sock.ev?.removeAllListeners?.();
        this.sock.end?.(undefined);
      } catch {
        // ignore — socket might already be half-closed
      }
      this.sock = null;
    }

    this.connected = false;
    this.latestQr = null;
    this.rejectWaiters(new ServiceUnavailableException('WhatsApp socket was torn down.'));

    if (removeAuth) {
      await this.authStore.clear();
    } else {
      // Flush any pending creds update so the just-paired device survives shutdown.
      await this.authStore.flush();
    }
  }

  // ───────────────────────────────────────────────────────────
  //  QR waiters (promise-based wait for the next emitted QR)
  // ───────────────────────────────────────────────────────────

  private waitForQr(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const waiter: QrWaiter = {
        resolve: (qr) => {
          clearTimeout(waiter.timeout);
          resolve(qr);
        },
        reject: (err) => {
          clearTimeout(waiter.timeout);
          reject(err);
        },
        timeout: setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          reject(new ServiceUnavailableException('QR code was not generated in time.'));
        }, QR_WAIT_TIMEOUT_MS),
      };

      this.waiters.push(waiter);
    });
  }

  private resolveWaiters(qr: string): void {
    const pending = this.waiters.splice(0);
    for (const waiter of pending) waiter.resolve(qr);
  }

  private rejectWaiters(err: Error): void {
    const pending = this.waiters.splice(0);
    for (const waiter of pending) waiter.reject(err);
  }

  // ───────────────────────────────────────────────────────────
  //  Helpers
  // ───────────────────────────────────────────────────────────

  /** Convert `+963XXXXXXXXX` (or `963…` / spaced variants) into a WhatsApp JID. */
  private toJid(phone: string): string {
    return phone.replace(/^\+/, '').replace(/\s+/g, '') + PERSONAL_CHAT_JID_SUFFIX;
  }

  /** Suppress Baileys' chatty internal pino logger. */
  private buildSilentLogger(): any {
    const noop = () => undefined;
    const silent: any = {
      level: 'silent',
      fatal: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
      child: () => silent,
    };
    return silent;
  }
}
