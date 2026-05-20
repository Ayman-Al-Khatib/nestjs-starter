import { UploadInput } from '../core/types/upload-input';
import { ValidationPolicy } from './validation-policy';

export interface IFileValidator {
  validate(input: UploadInput, policy: ValidationPolicy): void | Promise<void>;
}
