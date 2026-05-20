import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_VALIDATORS } from '../config/storage-tokens';
import { UploadInput } from '../core/types/upload-input';
import { IFileValidator } from './file-validator.interface';
import { ValidationPolicy } from './validation-policy';

@Injectable()
export class FileValidationService {
  constructor(
    @Inject(STORAGE_VALIDATORS) private readonly validators: IFileValidator[],
  ) {}

  async validate(input: UploadInput, policy: ValidationPolicy): Promise<void> {
    for (const validator of this.validators) {
      await validator.validate(input, policy);
    }
  }

  async validateMany(inputs: UploadInput[], policy: ValidationPolicy): Promise<void> {
    for (const input of inputs) {
      await this.validate(input, policy);
    }
  }
}
