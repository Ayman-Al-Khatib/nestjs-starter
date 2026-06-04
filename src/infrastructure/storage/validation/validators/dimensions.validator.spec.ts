import sharp from 'sharp';
import { FileValidationError } from '../../core/errors/storage.error';
import { UploadInput } from '../../core/types/upload-input';
import { ValidationPolicy } from '../validation-policy';
import { DimensionsValidator } from './dimensions.validator';

async function pngOf(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
}

function input(buffer: Buffer, mimeType = 'image/png'): UploadInput {
  return { buffer, originalName: 'img.png', mimeType, size: buffer.length };
}

function policy(over: Partial<ValidationPolicy> = {}): ValidationPolicy {
  return {
    required: true,
    allowedExtensions: ['png'],
    maxSize: '10MB',
    enforceMagicBytes: false,
    ...over,
  };
}

describe('DimensionsValidator', () => {
  const validator = new DimensionsValidator();

  it('is a no-op when the policy declares no dimension rule', async () => {
    await expect(
      validator.validate(input(Buffer.from('not-an-image')), policy()),
    ).resolves.toBeUndefined();
  });

  it('skips non-image inputs even when a rule is present', async () => {
    await expect(
      validator.validate(input(Buffer.from('text'), 'text/plain'), policy({ dimensions: { minWidth: 10 } })),
    ).resolves.toBeUndefined();
  });

  it('accepts an image that satisfies the dimension bounds', async () => {
    const buffer = await pngOf(100, 100);
    await expect(
      validator.validate(input(buffer), policy({ dimensions: { minWidth: 50, maxWidth: 200 } })),
    ).resolves.toBeUndefined();
  });

  it('rejects an image narrower than minWidth', async () => {
    const buffer = await pngOf(20, 100);
    await expect(
      validator.validate(input(buffer), policy({ dimensions: { minWidth: 50 } })),
    ).rejects.toThrow(FileValidationError);
  });

  it('rejects an image taller than maxHeight', async () => {
    const buffer = await pngOf(100, 500);
    await expect(
      validator.validate(input(buffer), policy({ dimensions: { maxHeight: 200 } })),
    ).rejects.toThrow(FileValidationError);
  });

  it('throws when the image metadata cannot be read', async () => {
    await expect(
      validator.validate(input(Buffer.from('garbage')), policy({ dimensions: { minWidth: 1 } })),
    ).rejects.toThrow(FileValidationError);
  });
});
