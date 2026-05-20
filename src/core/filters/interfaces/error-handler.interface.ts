import { ErrorResponse } from './error-response.interface';

/**
 * Strategy contract for converting an exception into a standardized
 * {@link ErrorResponse}. Implementations are registered in the
 * {@link ErrorHandlerFactory} and selected by {@link canHandle}.
 */
export interface ErrorHandler {
  /** Returns true when this handler is responsible for the given exception. */
  canHandle(error: unknown): boolean;

  /** Builds an {@link ErrorResponse} for the given exception. */
  handle(error: unknown): ErrorResponse;
}
