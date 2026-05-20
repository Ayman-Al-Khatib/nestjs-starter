import { CompressionPolicy } from '../processing/compression-policy';
import { ValidationPolicy } from '../validation/validation-policy';

export interface StorageModuleOptions {
  global?: boolean;
  signedUrlTtlSeconds?: number;
  defaultValidation?: Partial<ValidationPolicy>;
  defaultCompression?: Partial<CompressionPolicy>;
}

export interface ResolvedStorageConfig {
  signedUrlTtlSeconds: number;
  defaultValidation: ValidationPolicy;
  defaultCompression: CompressionPolicy;
}
