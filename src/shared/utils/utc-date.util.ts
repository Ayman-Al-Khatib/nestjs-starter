export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
