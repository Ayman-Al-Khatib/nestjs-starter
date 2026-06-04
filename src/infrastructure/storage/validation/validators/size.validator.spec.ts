import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { ValidationPolicy } from '../validation-policy';
import { SizeValidator } from './size.validator';

function input(over: Partial<UploadInput> = {}): UploadInput {
  return {
    buffer: Buffer.alloc(0),
    originalName: 'photo.png',
    mimeType: 'image/png',
    size: 1024,
    ...over,
  };
}

function policy(over: Partial<ValidationPolicy> = {}): ValidationPolicy {
  return {
    required: true,
    allowedExtensions: ['png', 'jpg'],
    maxSize: '10MB',
    enforceMagicBytes: false,
    ...over,
  };
}

describe('SizeValidator', () => {
  const validator = new SizeValidator();

  it('accepts a file within the global limit', () => {
    expect(() => validator.validate(input({ size: 5 * 1024 ** 2 }), policy())).not.toThrow();
  });

  it('rejects an empty file', () => {
    expect(() => validator.validate(input({ size: 0 }), policy())).toThrow(FileValidationError);
  });

  it('rejects a file exceeding the global maxSize', () => {
    expect(() => validator.validate(input({ size: 11 * 1024 ** 2 }), policy())).toThrow(
      FileValidationError,
    );
  });

  it('enforces a per-type limit when configured', () => {
    const p = policy({ perTypeMaxSize: { png: '1MB' } });
    expect(() => validator.validate(input({ size: 2 * 1024 ** 2 }), p)).toThrow(
      FileValidationError,
    );
  });

  it('ignores per-type limits for extensions not listed', () => {
    const p = policy({ perTypeMaxSize: { jpg: '1MB' } });
    expect(() =>
      validator.validate(input({ originalName: 'photo.png', size: 2 * 1024 ** 2 }), p),
    ).not.toThrow();
  });
});
