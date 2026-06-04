import { todayUtcDate } from './utc-date.util';

describe('todayUtcDate', () => {
  it('returns the current UTC calendar date as YYYY-MM-DD', () => {
    expect(todayUtcDate()).toBe(new Date().toISOString().slice(0, 10));
  });

  it('matches the YYYY-MM-DD shape', () => {
    expect(todayUtcDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
