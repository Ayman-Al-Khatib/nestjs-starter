import { HttpException, Injectable } from '@nestjs/common';
import { BaseErrorHandler } from '../base/base-error.handler';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles every {@link HttpException} thrown inside the app, normalizing the
 * shape produced by `error.getResponse()` (which can be a string, an object,
 * or `{ message: string[] }` from class-validator).
 */
@Injectable()
export class HttpExceptionHandler extends BaseErrorHandler {
  canHandle(error: unknown): boolean {
    return error instanceof HttpException;
  }

  handle(error: HttpException): ErrorResponse {
    const statusCode = error.getStatus();
    const raw = error.getResponse();
    const payload: Record<string, unknown> =
      typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : { message: raw };

    return this.buildResponse({
      statusCode,
      error: (payload.error as string) ?? error.name,
      message: this.extractMessage(payload, error),
      details: payload.data ?? payload.code,
    });
  }

  private extractMessage(
    payload: Record<string, unknown>,
    error: HttpException,
  ): string | string[] {
    const raw = payload.message ?? error.message;
    if (Array.isArray(raw)) return raw.length === 1 ? raw[0] : raw;
    return raw as string;
  }
}
