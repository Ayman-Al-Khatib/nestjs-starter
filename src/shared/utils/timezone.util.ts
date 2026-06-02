/**
 * Local-timezone math, built on `Intl.DateTimeFormat` (no external
 * libs). Interpret wall-clock `HH:mm` strings in a given IANA timezone
 * and derive the absolute UTC instants persisted/queried elsewhere —
 * never by string concatenation like `${date}T${HH:mm}Z`.
 *
 * DST policy: we accept `Intl`'s default resolution. A wall-clock
 * inside a spring-forward gap resolves to the closest valid instant
 * after the jump; a wall-clock inside a fall-back overlap resolves to
 * the first occurrence. `Asia/Damascus` has not observed DST since
 * 2022, so it is unaffected.
 */

export type IanaTz = string;

const MS_PER_DAY = 86_400_000;

/**
 * `'YYYY-MM-DD'` for the local calendar date that `instant` falls on
 * in `tz`. Uses `en-CA` because that locale formats as ISO date.
 */
export function localDayOf(instant: Date, tz: IanaTz): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(instant);
}

/**
 * Half-open UTC range covering one local calendar day in `tz`:
 * `[start of localDay in tz, start of next local day in tz)`. May be
 * 23h or 25h on DST transitions; in non-DST tz it is always 24h.
 */
export function localDayBoundsToUtc(
  localDay: string,
  tz: IanaTz,
): { start: Date; end: Date } {
  const start = localTimeToUtc(localDay, '00:00', tz);
  const end = localTimeToUtc(addOneLocalDay(localDay), '00:00', tz);
  return { start, end };
}

/**
 * UTC `Date` for the wall-clock `localDay HH:mm` in `tz`. The HH:mm
 * `'24:00'` is a sentinel meaning "start of the next local day" —
 * useful for a slot whose end is "end of day".
 *
 * Implementation: take the literal-UTC instant for the same wall
 * clock, project it back through `tz` to find the offset, then
 * adjust. Two passes cover all non-pathological DST cases.
 */
export function localTimeToUtc(localDay: string, hhmm: string, tz: IanaTz): Date {
  if (hhmm === '24:00') {
    return localTimeToUtc(addOneLocalDay(localDay), '00:00', tz);
  }

  const [y, mo, d] = localDay.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const literalUtcMs = Date.UTC(y, mo - 1, d, h, mi, 0, 0);

  // Two corrective passes against the projection's offset at the
  // candidate instant — this is sufficient because the DST gap is
  // at most one hour and the offset only changes at a DST boundary.
  let candidate = literalUtcMs - tzOffsetMs(literalUtcMs, tz);
  candidate = literalUtcMs - tzOffsetMs(candidate, tz);
  return new Date(candidate);
}

/** True when `tz` is a recognized IANA name. Falls back via try/catch. */
export function isValidIanaTimezone(tz: string): boolean {
  if (typeof tz !== 'string' || tz.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ---------------- internals ----------------

/** Adds one to a `'YYYY-MM-DD'` string via UTC math (purely lexical). */
function addOneLocalDay(localDay: string): string {
  const [y, mo, d] = localDay.split('-').map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d) + MS_PER_DAY);
  const ny = next.getUTCFullYear();
  const nm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(next.getUTCDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/**
 * Offset in ms between UTC and `tz` at the given instant. Positive
 * for tz east of UTC (`Asia/Damascus` → +3h = +10_800_000).
 */
function tzOffsetMs(instantMs: number, tz: IanaTz): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = fmt.formatToParts(new Date(instantMs));
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  // `Intl` may emit "24" for hour at midnight — clamp to 0.
  const hour = get('hour') === 24 ? 0 : get('hour');
  const asUtcMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );
  return asUtcMs - instantMs;
}
