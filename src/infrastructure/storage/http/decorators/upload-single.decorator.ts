import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MAX_UPLOAD_BYTES } from '../../config/defaults';

export function UploadSingle(fieldName: string = 'file', options?: MulterOptions) {
  // `limits` is deep-merged so a caller override of one limit can't silently
  // drop the sibling fileSize/files caps. fileSize is the memory backstop.
  const { limits, ...rest } = options ?? {};
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, ...limits },
        ...rest,
      }),
    ),
  );
}
