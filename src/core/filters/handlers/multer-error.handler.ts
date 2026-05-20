import { HttpStatus, Injectable } from '@nestjs/common';
import { BaseErrorHandler } from '../base/base-error.handler';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles file-upload errors emitted by Multer.
 * Detection is by `error.name === 'MulterError'` (Multer always sets this);
 * the human-readable message is resolved from the `code` field, which is
 * stable across Multer versions.
 */
@Injectable()
export class MulterErrorHandler extends BaseErrorHandler {
  private static readonly CODE_MESSAGES: Record<string, string> = {
    LIMIT_PART_COUNT: 'Too many parts in upload',
    LIMIT_FILE_SIZE: 'File is too large',
    LIMIT_FILE_COUNT: 'Too many files uploaded',
    LIMIT_FIELD_KEY: 'Field name is too long',
    LIMIT_FIELD_VALUE: 'Field value is too long',
    LIMIT_FIELD_COUNT: 'Too many fields in upload',
    LIMIT_UNEXPECTED_FILE: 'Unexpected field',
  };

  canHandle(error: unknown): boolean {
    return error instanceof Error && error.name === 'MulterError';
  }

  handle(error: Error & { code?: string }): ErrorResponse {
    const message =
      (error.code && MulterErrorHandler.CODE_MESSAGES[error.code]) ||
      error.message ||
      'File upload error';

    return this.buildResponse({
      statusCode: HttpStatus.BAD_REQUEST,
      error: error.code ?? 'UPLOAD_ERROR',
      message,
    });
  }
}
