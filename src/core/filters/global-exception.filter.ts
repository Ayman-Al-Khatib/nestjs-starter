import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorHandlerFactory } from './error-handler.factory';
import { ErrorContext, ErrorResponse } from './interfaces/error-response.interface';

const DEVELOPER_MODE_HEADER = 'x-developer-mode';

/**
 * Application-wide exception filter. Delegates response construction to the
 * matching {@link ErrorHandler} returned by {@link ErrorHandlerFactory}, then:
 *
 * 1. enriches the response with request metadata (path / method / stack),
 * 2. logs the error,
 * 3. strips diagnostic context unless the request is in developer mode.
 *
 * Developer mode requires `NODE_ENV=development` AND the request to *not*
 * opt out via `x-developer-mode: false`. Missing header counts as opt-in,
 * so context shows up by default in dev unless deliberately disabled.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly factory: ErrorHandlerFactory) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const errorResponse = this.resolveResponse(exception);
    this.enrichContext(errorResponse, request, exception);
    this.logError(errorResponse, request, exception);

    if (!this.isDeveloperMode(request)) {
      delete errorResponse.context;
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Builds the response via the matched handler.
   * If the handler itself throws, falls back to a safe 500 — this is the
   * last line of defence for the whole HTTP pipeline.
   */
  private resolveResponse(exception: unknown): ErrorResponse {
    try {
      return this.factory.getHandler(exception).handle(exception);
    } catch (handlerError) {
      this.logger.error(
        'Error handler itself threw — falling back to generic 500',
        handlerError instanceof Error ? handlerError.stack : String(handlerError),
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        context: {
          timestamp: new Date().toISOString(),
          details: handlerError instanceof Error ? handlerError.message : String(handlerError),
        },
      };
    }
  }

  private enrichContext(res: ErrorResponse, req: Request, exception: unknown): void {
    const context: ErrorContext = res.context ?? { timestamp: new Date().toISOString() };
    context.path = stripQuery(req.url);
    context.method = req.method;
    if (exception instanceof Error && exception.stack) {
      context.stack = exception.stack;
    }
    res.context = context;
  }

  private logError(res: ErrorResponse, req: Request, exception: unknown): void {
    const message = Array.isArray(res.message) ? res.message.join(' | ') : res.message;
    const stack = exception instanceof Error ? exception.stack : undefined;
    const requestId = req.requestId ?? '-';
    this.logger.error(
      `[${requestId}] [${req.method}] ${stripQuery(req.url)} → ${res.statusCode} ${res.error}: ${message}`,
      stack,
    );
  }

  private isDeveloperMode(request: Request): boolean {
    const isDev = process.env.NODE_ENV === 'development';
    const headerOn = request.headers[DEVELOPER_MODE_HEADER] !== 'false';
    return isDev && headerOn;
  }
}

// Query strings can carry signed-URL tokens, OTP codes, or other short-lived
// secrets — drop them before logging or echoing back to clients.
function stripQuery(url: string): string {
  const i = url.indexOf('?');
  return i === -1 ? url : url.slice(0, i);
}
