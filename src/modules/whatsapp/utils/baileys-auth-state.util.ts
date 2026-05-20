import { WhatsappAuthService } from '../services/whatsapp-auth.service';

/**
 * Minimal `SignalAuthState` factory for Baileys.
 *
 * Persistence policy (intentional, send-only use case):
 *   - `creds`         → written to the configured storage provider on every
 *                        Baileys `creds.update`. This is the device-pairing
 *                        record; losing it forces the operator to re-scan
 *                        the QR.
 *   - signal `keys`   → kept in memory only. Ratchet state, pre-keys and
 *                        sender keys exist so the device can decrypt INCOMING
 *                        chats. We never read messages, so wiping them on
 *                        restart is harmless: a fresh ratchet is negotiated
 *                        on the next outgoing send.
 *
 * Storage is abstracted through `WhatsappAuthService` so the same code path
 * works against the local filesystem in dev and Supabase in prod — Vercel
 * deployments would otherwise nuke the credentials on every push.
 *
 * The shape returned matches `useMultiFileAuthState`'s contract so it can be
 * passed straight into `makeWASocket({ auth })`.
 */
export interface BaileysAuthState {
  state: {
    creds: any;
    keys: {
      get: (type: string, ids: string[]) => Promise<Record<string, any>>;
      set: (data: Record<string, Record<string, any>>) => Promise<void>;
    };
  };
  saveCreds: () => void;
}

export async function buildBaileysAuthState(
  baileys: any,
  store: WhatsappAuthService,
): Promise<BaileysAuthState> {
  const { initAuthCreds, BufferJSON } = baileys;

  // Hydrate creds from remote storage if present; otherwise start fresh.
  let stored: { creds?: any } = {};
  const serialized = await store.load();
  if (serialized) {
    try {
      stored = JSON.parse(serialized, BufferJSON.reviver);
    } catch {
      // Corrupt blob → treat as no pairing; admin will need a new QR.
      stored = {};
    }
  }

  const creds = stored.creds ?? initAuthCreds();
  const inMemoryKeys: Record<string, any> = {};

  const saveCreds = (): void => {
    const payload = JSON.stringify({ creds }, BufferJSON.replacer, 2);
    store.save(payload);
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result: Record<string, any> = {};
          for (const id of ids) {
            const value = inMemoryKeys[`${type}-${id}`];
            if (value !== undefined && value !== null) result[id] = value;
          }
          return result;
        },
        set: async (data) => {
          for (const [type, entries] of Object.entries(data)) {
            for (const [id, value] of Object.entries(entries)) {
              const key = `${type}-${id}`;
              if (value !== null && value !== undefined) inMemoryKeys[key] = value;
              else delete inMemoryKeys[key];
            }
          }
          // Intentionally NOT persisting keys — see file header.
        },
      },
    },
    saveCreds,
  };
}
