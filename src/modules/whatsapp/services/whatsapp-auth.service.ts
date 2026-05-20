import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { STORAGE_PROVIDER } from 'infrastructure/storage/config/storage-tokens';
import { Visibility } from 'infrastructure/storage/core/enums/visibility.enum';
import { FileNotFoundError } from 'infrastructure/storage/core/errors/storage.error';
import { IStorageProvider } from 'infrastructure/storage/providers/storage-provider.interface';
import {
  WHATSAPP_AUTH_FLUSH_DEBOUNCE_MS,
  WHATSAPP_AUTH_STORAGE_KEY,
} from '../utils/whatsapp.constants';

/**
 * Persists Baileys credentials in the configured storage provider
 * (local in dev, Supabase in prod) instead of the local filesystem so a
 * paired session survives Vercel deployments (where `/tmp` is wiped).
 *
 * Two-tier model:
 *   - In-memory snapshot is the hot path and authoritative inside the
 *     process. Reads after the first hydration never touch storage.
 *   - Remote object (`private/whatsapp/session.json`) is the durable
 *     source of truth across restarts. Writes are debounced because
 *     Baileys fires `creds.update` repeatedly during a single handshake.
 *
 * The provider is injected via `STORAGE_PROVIDER` (not `StorageService`)
 * because we need a stable, overwritable key — `StorageService.upload`
 * hashes a fresh filename per call and would leave orphan blobs behind.
 */
@Injectable()
export class WhatsappAuthService implements OnModuleDestroy {
  private readonly key = WHATSAPP_AUTH_STORAGE_KEY;
  private cached: string | null = null;
  private hydrated = false;
  private pending: string | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private flushInFlight: Promise<void> | null = null;

  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider) {}

  /**
   * Returns the serialized auth blob, hitting remote storage at most once
   * per process. `null` means no paired session exists yet.
   */
  async load(): Promise<string | null> {
    if (this.hydrated) return this.cached;

    try {
      const buffer = await this.storage.read(this.key);
      this.cached = buffer.toString('utf-8');
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        this.cached = null;
      } else {
        throw err;
      }
    }

    this.hydrated = true;
    return this.cached;
  }

  /**
   * Updates the in-memory snapshot synchronously and schedules a remote
   * write. Subsequent calls within the debounce window collapse into one
   * upload — Baileys emits `creds.update` repeatedly during a single
   * handshake.
   */
  save(serialized: string): void {
    this.cached = serialized;
    this.hydrated = true;
    this.pending = serialized;

    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, WHATSAPP_AUTH_FLUSH_DEBOUNCE_MS);
  }

  /**
   * Forces any pending write to land in remote storage. Called from
   * `onModuleDestroy` so a shutdown mid-handshake doesn't drop the last
   * credential update.
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.flushInFlight) {
      await this.flushInFlight;
    }

    const payload = this.pending;
    if (payload === null) return;
    this.pending = null;

    this.flushInFlight = this.uploadPayload(payload).finally(() => {
      this.flushInFlight = null;
    });

    await this.flushInFlight;
  }

  async clear(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pending = null;
    this.cached = null;
    this.hydrated = true;

    try {
      await this.storage.delete(this.key);
    } catch (err) {
      if (!(err instanceof FileNotFoundError)) throw err;
    }
  }

  async exists(): Promise<boolean> {
    if (this.hydrated) return this.cached !== null;
    return this.storage.exists(this.key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.flush();
  }

  private async uploadPayload(serialized: string): Promise<void> {
    const buffer = Buffer.from(serialized, 'utf-8');
    await this.storage.save(
      {
        buffer,
        originalName: 'session.json',
        mimeType: 'application/json',
        size: buffer.length,
      },
      {
        key: this.key,
        visibility: Visibility.PRIVATE,
        contentType: 'application/json',
      },
    );
  }
}
