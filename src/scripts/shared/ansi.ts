// Matching ANSI control characters (ESC / CSI) is the entire purpose of this
// stripper, so the no-control-regex rule is intentionally disabled here.
const ANSI_ESCAPE_PATTERN =
  /[][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g; // eslint-disable-line no-control-regex

export function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_PATTERN, '');
}
