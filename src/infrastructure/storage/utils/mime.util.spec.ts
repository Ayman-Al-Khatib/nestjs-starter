import { mimeFromExtension } from './mime.util';

describe('mimeFromExtension', () => {
  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.PNG', 'image/png'],
    ['doc.pdf', 'application/pdf'],
    ['note.txt', 'text/plain'],
    ['icon.svg', 'image/svg+xml'],
  ])('maps %s to %s', (filename, expected) => {
    expect(mimeFromExtension(filename)).toBe(expected);
  });

  it('returns octet-stream for unknown extensions', () => {
    expect(mimeFromExtension('app.exe')).toBe('application/octet-stream');
  });

  it('returns octet-stream when there is no extension', () => {
    expect(mimeFromExtension('README')).toBe('application/octet-stream');
  });
});
