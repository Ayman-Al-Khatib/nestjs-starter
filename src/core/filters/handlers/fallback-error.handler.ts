import { HttpStatus, Injectable } from '@nestjs/common';
import { BaseErrorHandler } from '../base/base-error.handler';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Catch-all handler used when no specific handler matches.
 * Always returns a 500 with a generic message — handler-specific details are
 * never leaked to the client.
 */
@Injectable()
export class FallbackErrorHandler extends BaseErrorHandler {
  canHandle(): boolean {
    return true;
  }

  handle(error: unknown): ErrorResponse {
    const details = error instanceof Error ? error.message : String(error);
    return this.buildResponse({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details,
    });
  }
}
