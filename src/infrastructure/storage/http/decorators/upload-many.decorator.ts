import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export function UploadMany(
  fieldName: string = 'files',
  maxCount: number = 5,
  options?: MulterOptions,
) {
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, maxCount, { limits: { files: maxCount }, ...options }),
    ),
  );
}
