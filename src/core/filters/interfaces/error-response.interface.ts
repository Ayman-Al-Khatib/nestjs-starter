/**
 * Standardized error response returned to clients by the global exception filter.
 */
export interface ErrorResponse {
  /** HTTP status code. */
  statusCode: number;

  /** Short, machine-readable error code (e.g. `BAD_REQUEST`, `TOKEN_EXPIRED`). */
  error: string;

  /** Human-readable message, or a list of messages for validation-style errors. */
  message: string | string[];

  /** Diagnostic context. Stripped from the response outside developer mode. */
  context?: ErrorContext;
}

/**
 * Diagnostic context attached to an {@link ErrorResponse}.
 * Exposed to clients only when the request opts into developer mode.
 */
export interface ErrorContext {
  /** ISO 8601 timestamp at which the error was produced. */
  timestamp: string;

  /** Request path that produced the error. */
  path?: string;

  /** HTTP method of the failing request. */
  method?: string;

  /** Arbitrary handler-specific diagnostic payload. */
  details?: unknown;

  /** Stack trace of the underlying exception. */
  stack?: string;
}
