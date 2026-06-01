import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MAX_UPLOAD_BYTES } from '../../config/defaults';

export function UploadMany(
  fieldName: string = 'files',
  maxCount: number = 5,
  options?: MulterOptions,
) {
  // Deep-merge `limits` so a caller override can't drop the sibling caps.
  // fileSize is the per-file memory backstop; files bounds the batch.
  const { limits, ...rest } = options ?? {};
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, maxCount, {
        limits: { fileSize: MAX_UPLOAD_BYTES, files: maxCount, ...limits },
        ...rest,
      }),
    ),
  );
}
