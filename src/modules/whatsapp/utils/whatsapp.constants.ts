/**
 * Storage key for the persisted Baileys credentials blob. Lives under
 * the `private/` prefix so it never gets a public URL and is fetched
 * only via the storage provider (signed reads in prod, direct fs in dev).
 *
 * The file stores ONLY the data required to re-attach a previously paired
 * device to WhatsApp's servers on the next boot — Signal protocol session
 * keys and message ratchet state are never persisted.
 */
export const WHATSAPP_AUTH_STORAGE_KEY = 'private/whatsapp/session.json';

/**
 * Debounce window before a `creds.update` is uploaded to remote storage.
 * Baileys emits this event several times during a single handshake; we
 * coalesce them into one write to keep Supabase request volume bounded.
 */
export const WHATSAPP_AUTH_FLUSH_DEBOUNCE_MS = 1000;

/** Hard cap on how long `/qr` will wait for Baileys to emit a fresh QR. */
export const QR_WAIT_TIMEOUT_MS = 60_000;

/** JID suffix WhatsApp uses for personal (1:1) accounts. */
export const PERSONAL_CHAT_JID_SUFFIX = '@s.whatsapp.net';

/** Default device label shown inside WhatsApp → Linked Devices on the phone. */
export const WA_DEVICE_LABEL: [string, string, string] = ['Eldar Dental', 'Server', '1.0.0'];
