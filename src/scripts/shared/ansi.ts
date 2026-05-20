const ANSI_ESCAPE_PATTERN =
  /[][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_PATTERN, '');
}
