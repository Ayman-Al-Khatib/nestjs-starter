import { HttpStatus, Injectable } from '@nestjs/common';
import { BaseErrorHandler } from '../base/base-error.handler';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles `jsonwebtoken` errors by class-name match instead of `instanceof`,
 * so we don't have to import `jsonwebtoken` here (it has compatibility issues
 * with Node.js v25).
 */
@Injectable()
export class JwtErrorHandler extends BaseErrorHandler {
  private static readonly JWT_ERROR_NAMES = new Set([
    'JsonWebTokenError',
    'TokenExpiredError',
    'NotBeforeError',
  ]);

  canHandle(error: unknown): boolean {
    return error instanceof Error && JwtErrorHandler.JWT_ERROR_NAMES.has(error.name);
  }

  handle(error: Error): ErrorResponse {
    const isExpired = error.name === 'TokenExpiredError';
    const code = isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';

    return this.buildResponse({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: code,
      message: isExpired ? 'Token has expired' : 'Invalid token signature',
      details: code,
    });
  }
}
