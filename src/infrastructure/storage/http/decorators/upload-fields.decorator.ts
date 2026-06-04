import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  MulterField,
  MulterOptions,
} from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MAX_UPLOAD_BYTES } from '../../config/defaults';

export function UploadFields(fields: MulterField[], options?: MulterOptions) {
  if (!fields?.length) {
    throw new Error('UploadFields: at least one field is required');
  }
  // Per-field counts come from each MulterField.maxCount; fileSize is the
  // per-file memory backstop. Deep-merge so a caller override keeps it.
  const { limits, ...rest } = options ?? {};
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(fields, {
        limits: { fileSize: MAX_UPLOAD_BYTES, ...limits },
        ...rest,
      }),
    ),
  );
}
