import { Visibility } from '../enums/visibility.enum';
import type { CompressionPolicy } from '../../processing/compression-policy';
import type { ValidationPolicy } from '../../validation/validation-policy';

export interface UploadOptions {
  visibility: Visibility;
  folder?: string;
  validation?: Partial<ValidationPolicy> | false;
  compression?: Partial<CompressionPolicy> | false;
}

export interface SaveTarget {
  key: string;
  visibility: Visibility;
  contentType?: string;
}
