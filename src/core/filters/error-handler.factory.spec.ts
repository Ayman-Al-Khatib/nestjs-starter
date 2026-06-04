import { ErrorHandlerFactory } from './error-handler.factory';
import { FallbackErrorHandler } from './handlers/fallback-error.handler';
import { HttpExceptionHandler } from './handlers/http-exception.handler';
import { I18nValidationErrorHandler } from './handlers/i18n-validation-error.handler';
import { JwtErrorHandler } from './handlers/jwt-error.handler';
import { MulterErrorHandler } from './handlers/multer-error.handler';
import { TypeOrmErrorHandler } from './handlers/typeorm-error.handler';
import { ErrorHandler } from './interfaces/error-handler.interface';

function stub(canHandle: boolean, tag: string): ErrorHandler {
  return {
    canHandle: jest.fn().mockReturnValue(canHandle),
    handle: jest.fn().mockReturnValue({ statusCode: 0, error: tag, message: tag }),
  };
}

describe('ErrorHandlerFactory', () => {
  it('returns the first handler whose canHandle matches, in registration order', () => {
    const multer = stub(false, 'multer');
    const jwt = stub(false, 'jwt');
    const typeorm = stub(true, 'typeorm');
    const i18n = stub(true, 'i18n');
    const http = stub(false, 'http');
    const fallback = stub(true, 'fallback') as FallbackErrorHandler;

    const factory = new ErrorHandlerFactory(
      multer as MulterErrorHandler,
      jwt as JwtErrorHandler,
      typeorm as TypeOrmErrorHandler,
      i18n as I18nValidationErrorHandler,
      http as HttpExceptionHandler,
      fallback,
    );

    // typeorm matches first even though i18n would also match.
    expect(factory.getHandler(new Error())).toBe(typeorm);
  });

  it('falls back when no specific handler matches', () => {
    const decliners = ['m', 'j', 't', 'i', 'h'].map((t) => stub(false, t));
    const fallback = stub(true, 'fallback') as FallbackErrorHandler;
    const factory = new ErrorHandlerFactory(
      decliners[0] as MulterErrorHandler,
      decliners[1] as JwtErrorHandler,
      decliners[2] as TypeOrmErrorHandler,
      decliners[3] as I18nValidationErrorHandler,
      decliners[4] as HttpExceptionHandler,
      fallback,
    );
    expect(factory.getHandler(new Error())).toBe(fallback);
  });
});
