import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { FilenameValidator } from './filename.validator';

function input(originalName: string): UploadInput {
  return { buffer: Buffer.alloc(0), originalName, mimeType: 'image/png', size: 1 };
}

describe('FilenameValidator', () => {
  const validator = new FilenameValidator();

  it('accepts a normal latin filename', () => {
    expect(() => validator.validate(input('My_Photo-1 (final).png'))).not.toThrow();
  });

  it('accepts an Arabic filename', () => {
    expect(() => validator.validate(input('صورة.png'))).not.toThrow();
  });

  it('rejects an empty filename', () => {
    expect(() => validator.validate(input(''))).toThrow(FileValidationError);
  });

  it('rejects a filename containing a null byte', () => {
    expect(() => validator.validate(input('photo\0.png'))).toThrow(FileValidationError);
  });

  it('rejects disallowed characters (path separators, wildcards)', () => {
    expect(() => validator.validate(input('a/b.png'))).toThrow(FileValidationError);
    expect(() => validator.validate(input('a*b.png'))).toThrow(FileValidationError);
    expect(() => validator.validate(input('emoji😀.png'))).toThrow(FileValidationError);
  });
});
