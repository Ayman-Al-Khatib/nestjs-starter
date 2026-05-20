import { FormatEnum } from 'sharp';
import { FileSize } from '../core/types/file-size';

export type ImageFormat = keyof FormatEnum;

export interface CompressionPolicy {
  enabled: boolean;
  quality: number;
  minQuality: number;
  maxOutputSize: FileSize;
  outputFormat: ImageFormat;
}
