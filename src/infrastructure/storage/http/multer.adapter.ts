/// <reference types="multer" />
import { UploadInput } from '../core/types/upload-input';

export type MulterFile = Express.Multer.File;

export const MulterAdapter = {
  toUploadInput(file: MulterFile): UploadInput {
    return {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  },

  toUploadInputs(files: MulterFile[]): UploadInput[] {
    return files.map(MulterAdapter.toUploadInput);
  },

  fromUploadInput(file: MulterFile, input: UploadInput): MulterFile {
    return {
      ...file,
      buffer: input.buffer,
      originalname: input.originalName,
      mimetype: input.mimeType,
      size: input.size,
    };
  },
};
