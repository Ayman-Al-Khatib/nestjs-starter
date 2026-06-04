import { IFileValidator } from './file-validator.interface';
import { FileValidationService } from './file-validation.service';
import { UploadInput } from '../core/types/upload-input';
import { ValidationPolicy } from './validation-policy';

const input = (name: string): UploadInput => ({
  buffer: Buffer.alloc(1),
  originalName: name,
  mimeType: 'image/png',
  size: 1,
});

const policy = {} as ValidationPolicy;

describe('FileValidationService', () => {
  it('runs every registered validator in order', async () => {
    const v1: IFileValidator = { validate: jest.fn().mockResolvedValue(undefined) };
    const v2: IFileValidator = { validate: jest.fn().mockResolvedValue(undefined) };
    const service = new FileValidationService([v1, v2]);

    await service.validate(input('a.png'), policy);

    expect(v1.validate).toHaveBeenCalledWith(input('a.png'), policy);
    expect(v2.validate).toHaveBeenCalled();
  });

  it('propagates the first validator that rejects', async () => {
    const boom = new Error('rejected');
    const v1: IFileValidator = { validate: jest.fn().mockRejectedValue(boom) };
    const v2: IFileValidator = { validate: jest.fn() };
    const service = new FileValidationService([v1, v2]);

    await expect(service.validate(input('a.png'), policy)).rejects.toThrow(boom);
    expect(v2.validate).not.toHaveBeenCalled();
  });

  it('validates every input in validateMany', async () => {
    const v1: IFileValidator = { validate: jest.fn().mockResolvedValue(undefined) };
    const service = new FileValidationService([v1]);

    await service.validateMany([input('a.png'), input('b.png')], policy);
    expect(v1.validate).toHaveBeenCalledTimes(2);
  });
});
