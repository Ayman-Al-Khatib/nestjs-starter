import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { ValidationPolicy } from '../validation-policy';
import { MimeTypeValidator } from './mime-type.validator';

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

function input(over: Partial<UploadInput> = {}): UploadInput {
  return {
    buffer: PNG_BYTES,
    originalName: 'photo.png',
    mimeType: 'image/png',
    size: PNG_BYTES.length,
    ...over,
  };
}

function policy(over: Partial<ValidationPolicy> = {}): ValidationPolicy {
  return {
    required: true,
    allowedExtensions: ['png', 'jpg', 'jpeg', 'txt'],
    maxSize: '10MB',
    enforceMagicBytes: true,
    ...over,
  };
}

describe('MimeTypeValidator', () => {
  const validator = new MimeTypeValidator();

  it('accepts a file whose extension is allowed and whose bytes match', () => {
    expect(() => validator.validate(input(), policy())).not.toThrow();
  });

  it('rejects a file with no extension', () => {
    expect(() => validator.validate(input({ originalName: 'noext' }), policy())).toThrow(
      FileValidationError,
    );
  });

  it('rejects an extension outside the allowlist', () => {
    expect(() =>
      validator.validate(input({ originalName: 'malware.exe' }), policy()),
    ).toThrow(FileValidationError);
  });

  it('rejects content whose magic bytes contradict the extension (spoofed header)', () => {
    // .png extension but real JPEG bytes — the attack the magic-byte check defends against.
    expect(() =>
      validator.validate(
        input({ originalName: 'photo.png', buffer: JPEG_BYTES, mimeType: 'image/png' }),
        policy(),
      ),
    ).toThrow(FileValidationError);
  });

  it('skips byte inspection for text files', () => {
    expect(() =>
      validator.validate(
        input({ originalName: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') }),
        policy(),
      ),
    ).not.toThrow();
  });

  it('skips byte inspection when the policy disables magic-byte enforcement', () => {
    expect(() =>
      validator.validate(
        input({ originalName: 'photo.png', buffer: Buffer.from('not really a png') }),
        policy({ enforceMagicBytes: false }),
      ),
    ).not.toThrow();
  });
});
