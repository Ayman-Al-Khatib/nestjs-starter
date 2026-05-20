import { ErrorHandler } from '../interfaces/error-handler.interface';
import { ErrorContext, ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Abstract base for {@link ErrorHandler} implementations.
 *
 * Subclasses implement {@link canHandle} and {@link handle}; the latter should
 * compose its response via {@link buildResponse} so timestamp and context shape
 * remain consistent across handlers.
 */
export abstract class BaseErrorHandler implements ErrorHandler {
  abstract canHandle(error: unknown): boolean;
  abstract handle(error: unknown): ErrorResponse;

  protected buildResponse(params: {
    statusCode: number;
    error: string;
    message: string | string[];
    details?: unknown;
  }): ErrorResponse {
    const context: ErrorContext = { timestamp: new Date().toISOString() };
    if (params.details !== undefined) context.details = params.details;

    return {
      statusCode: params.statusCode,
      error: params.error,
      message: params.message,
      context,
    };
  }
}
