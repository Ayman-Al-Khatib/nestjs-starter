import { UploadInput } from '../core/types/upload-input';
import { CompressionPolicy } from './compression-policy';

export interface IImageProcessor {
  process(input: UploadInput, policy: CompressionPolicy): Promise<UploadInput>;
}
