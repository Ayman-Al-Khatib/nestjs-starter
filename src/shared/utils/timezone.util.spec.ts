import {
  isValidIanaTimezone,
  localDayBoundsToUtc,
  localDayOf,
  localTimeToUtc,
} from './timezone.util';

// Asia/Damascus has observed a fixed +03:00 offset (no DST) since 2022,
// which makes it a stable anchor for deterministic offset assertions.
const DAMASCUS = 'Asia/Damascus';

describe('timezone.util', () => {
  describe('localDayOf', () => {
    it('returns the local calendar date for an instant in the given tz', () => {
      // 2026-06-01T22:00Z is already 2026-06-02 01:00 in Damascus (+3).
      const instant = new Date('2026-06-01T22:00:00.000Z');
      expect(localDayOf(instant, DAMASCUS)).toBe('2026-06-02');
    });

    it('returns the UTC date when tz is UTC', () => {
      expect(localDayOf(new Date('2026-06-01T22:00:00.000Z'), 'UTC')).toBe('2026-06-01');
    });
  });

  describe('localTimeToUtc', () => {
    it('maps a Damascus wall-clock to the correct UTC instant (+3 offset)', () => {
      const utc = localTimeToUtc('2026-06-02', '09:00', DAMASCUS);
      expect(utc.toISOString()).toBe('2026-06-02T06:00:00.000Z');
    });

    it('treats 24:00 as the start of the next local day', () => {
      const endOfDay = localTimeToUtc('2026-06-02', '24:00', DAMASCUS);
      const nextMidnight = localTimeToUtc('2026-06-03', '00:00', DAMASCUS);
      expect(endOfDay.getTime()).toBe(nextMidnight.getTime());
    });

    it('is identity-like for UTC tz', () => {
      expect(localTimeToUtc('2026-06-02', '09:00', 'UTC').toISOString()).toBe(
        '2026-06-02T09:00:00.000Z',
      );
    });
  });

  describe('localDayBoundsToUtc', () => {
    it('returns a half-open [start, nextDayStart) range', () => {
      const { start, end } = localDayBoundsToUtc('2026-06-02', DAMASCUS);
      expect(start.toISOString()).toBe('2026-06-01T21:00:00.000Z');
      expect(end.toISOString()).toBe('2026-06-02T21:00:00.000Z');
    });

    it('spans exactly 24h in a non-DST timezone', () => {
      const { start, end } = localDayBoundsToUtc('2026-06-02', DAMASCUS);
      expect(end.getTime() - start.getTime()).toBe(86_400_000);
    });

    it('handles month rollover', () => {
      const { start, end } = localDayBoundsToUtc('2026-01-31', 'UTC');
      expect(start.toISOString()).toBe('2026-01-31T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });
  });

  describe('isValidIanaTimezone', () => {
    it('accepts well-known IANA names', () => {
      expect(isValidIanaTimezone('UTC')).toBe(true);
      expect(isValidIanaTimezone('Asia/Damascus')).toBe(true);
      expect(isValidIanaTimezone('America/New_York')).toBe(true);
    });

    it('rejects unknown or malformed names', () => {
      expect(isValidIanaTimezone('Not/AZone')).toBe(false);
      expect(isValidIanaTimezone('')).toBe(false);
      expect(isValidIanaTimezone(undefined as unknown as string)).toBe(false);
    });
  });
});
