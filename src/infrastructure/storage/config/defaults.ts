import { CompressionPolicy } from '../processing/compression-policy';
import { ValidationPolicy } from '../validation/validation-policy';

export const DEFAULT_VALIDATION_POLICY: ValidationPolicy = {
  allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
  maxSize: '10MB',
  perTypeMaxSize: {
    png: '2MB',
    jpg: '2MB',
    jpeg: '2MB',
    webp: '2MB',
    pdf: '4MB',
    mp4: '20MB',
    mp3: '4MB',
    ogg: '4MB',
    docx: '4MB',
    txt: '1MB',
  },
  required: true,
  enforceMagicBytes: true,
};

export const DEFAULT_COMPRESSION_POLICY: CompressionPolicy = {
  enabled: true,
  quality: 80,
  minQuality: 50,
  maxOutputSize: '150KB',
  outputFormat: 'jpeg',
};

export const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;

// Coarse network-level backstop enforced by Multer BEFORE a file is fully
// buffered into memory. Sits above the largest per-route ValidationPolicy
// maxSize (mp4 = 20MB) so the fine-grained, i18n-aware validators still emit
// the per-type "file too large" error for normal oversize uploads — Multer
// only aborts abusive uploads that would otherwise exhaust process memory.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
