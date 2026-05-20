import { Injectable } from '@nestjs/common';
import { FallbackErrorHandler } from './handlers/fallback-error.handler';
import { HttpExceptionHandler } from './handlers/http-exception.handler';
import { I18nValidationErrorHandler } from './handlers/i18n-validation-error.handler';
import { JwtErrorHandler } from './handlers/jwt-error.handler';
import { MulterErrorHandler } from './handlers/multer-error.handler';
import { TypeOrmErrorHandler } from './handlers/typeorm-error.handler';
import { ErrorHandler } from './interfaces/error-handler.interface';

/**
 * Selects the appropriate {@link ErrorHandler} for a given exception.
 *
 * Handlers are evaluated in registration order — list more specific handlers
 * before more general ones. {@link FallbackErrorHandler} always matches, so it
 * is held separately and consulted only when every other handler declines.
 */
@Injectable()
export class ErrorHandlerFactory {
  private readonly handlers: ReadonlyArray<ErrorHandler>;

  constructor(
    multer: MulterErrorHandler,
    jwt: JwtErrorHandler,
    typeorm: TypeOrmErrorHandler,
    i18nValidation: I18nValidationErrorHandler,
    http: HttpExceptionHandler,
    private readonly fallback: FallbackErrorHandler,
  ) {
    this.handlers = [multer, jwt, typeorm, i18nValidation, http];
  }

  getHandler(error: unknown): ErrorHandler {
    return this.handlers.find((handler) => handler.canHandle(error)) ?? this.fallback;
  }
}
