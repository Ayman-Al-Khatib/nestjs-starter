import { UploadedFile, UploadedFiles } from '@nestjs/common';
import { CompressionPolicy } from '../../processing/compression-policy';
import { ValidationPolicy } from '../../validation/validation-policy';
import { MulterImagePipe, MulterImagePipeWith } from '../pipes/multer-image.pipe';
import { MulterValidationPipe, MulterValidationPipeWith } from '../pipes/multer-validation.pipe';

export interface ProcessedFileOptions {
  validation?: Partial<ValidationPolicy> | false;
  compression?: Partial<CompressionPolicy> | false;
}

function buildPipes(options?: ProcessedFileOptions) {
  const validationPipe =
    options?.validation !== undefined
      ? MulterValidationPipeWith(options.validation)
      : MulterValidationPipe;
  const imagePipe =
    options?.compression !== undefined
      ? MulterImagePipeWith(options.compression)
      : MulterImagePipe;
  return [validationPipe, imagePipe];
}

export const ProcessedFile = (options?: ProcessedFileOptions) =>
  UploadedFile(...buildPipes(options));

export const ProcessedFiles = (options?: ProcessedFileOptions) =>
  UploadedFiles(...buildPipes(options));
