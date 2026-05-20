import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  MulterField,
  MulterOptions,
} from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export function UploadFields(fields: MulterField[], options?: MulterOptions) {
  if (!fields?.length) {
    throw new Error('UploadFields: at least one field is required');
  }
  return applyDecorators(UseInterceptors(FileFieldsInterceptor(fields, options)));
}
