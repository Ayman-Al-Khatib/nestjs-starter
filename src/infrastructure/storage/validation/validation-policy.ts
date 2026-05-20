import { FileSize } from '../core/types/file-size';

export interface DimensionRule {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface ValidationPolicy {
  required: boolean;
  allowedExtensions: string[];
  maxSize: FileSize;
  perTypeMaxSize?: Record<string, FileSize>;
  dimensions?: DimensionRule;
  enforceMagicBytes: boolean;
}
