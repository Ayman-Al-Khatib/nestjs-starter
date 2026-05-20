import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export function UploadSingle(fieldName: string = 'file', options?: MulterOptions) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, { limits: { files: 1 }, ...options })),
  );
}
