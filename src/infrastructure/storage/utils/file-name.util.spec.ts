import { extractBaseName, extractExtension, uniqueFileName } from './file-name.util';

describe('extractExtension', () => {
  it('returns the lowercase extension', () => {
    expect(extractExtension('Photo.PNG')).toBe('png');
    expect(extractExtension('archive.tar.gz')).toBe('gz');
  });

  it('returns empty string when there is no extension', () => {
    expect(extractExtension('README')).toBe('');
  });

  it('treats a leading dot (dotfile) as having no extension', () => {
    expect(extractExtension('.gitignore')).toBe('');
  });
});

describe('extractBaseName', () => {
  it('returns the name without its extension', () => {
    expect(extractBaseName('photo.png')).toBe('photo');
    expect(extractBaseName('archive.tar.gz')).toBe('archive.tar');
  });

  it('returns the whole name when there is no extension', () => {
    expect(extractBaseName('README')).toBe('README');
    expect(extractBaseName('.gitignore')).toBe('.gitignore');
  });
});

describe('uniqueFileName', () => {
  it('produces a timestamped, randomized name preserving the extension', () => {
    const name = uniqueFileName('My Photo.png');
    expect(name).toMatch(/^My-Photo-\d{17}-\d{4}\.png$/);
  });

  it('honors an override extension', () => {
    expect(uniqueFileName('photo.png', 'webp')).toMatch(/\.webp$/);
  });

  it('strips path separators and null bytes from the original name', () => {
    const name = uniqueFileName('../../etc/passwd\0.png');
    expect(name).not.toContain('/');
    expect(name).not.toContain('\\');
    expect(name).not.toContain('\0');
  });

  it('falls back to "file" when the base name reduces to empty', () => {
    expect(uniqueFileName('...')).toMatch(/^file-\d{17}-\d{4}$/);
  });

  it('omits the extension segment when none can be determined', () => {
    expect(uniqueFileName('plainname')).toMatch(/^plainname-\d{17}-\d{4}$/);
  });

  it('generates distinct names across calls', () => {
    const names = new Set(Array.from({ length: 50 }, () => uniqueFileName('a.png')));
    expect(names.size).toBeGreaterThan(1);
  });
});
