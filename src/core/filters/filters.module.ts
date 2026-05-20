import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorHandlerFactory } from './error-handler.factory';
import { GlobalExceptionFilter } from './global-exception.filter';
import { FallbackErrorHandler } from './handlers/fallback-error.handler';
import { HttpExceptionHandler } from './handlers/http-exception.handler';
import { I18nValidationErrorHandler } from './handlers/i18n-validation-error.handler';
import { JwtErrorHandler } from './handlers/jwt-error.handler';
import { MulterErrorHandler } from './handlers/multer-error.handler';
import { TypeOrmErrorHandler } from './handlers/typeorm-error.handler';

/**
 * Registers the global exception filter, every error handler, and the
 * factory that selects between them. Importing this module is enough to
 * enable centralized error handling for the whole application.
 */
@Global()
@Module({
  providers: [
    I18nValidationErrorHandler,
    HttpExceptionHandler,
    JwtErrorHandler,
    MulterErrorHandler,
    TypeOrmErrorHandler,
    FallbackErrorHandler,
    ErrorHandlerFactory,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ErrorHandlerFactory],
})
export class FiltersModule {}
