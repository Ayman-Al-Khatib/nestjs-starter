import { HttpStatus } from '@nestjs/common';
import { MulterErrorHandler } from './multer-error.handler';

function multerError(code?: string, message = 'multer failed'): Error & { code?: string } {
  const err = new Error(message) as Error & { code?: string };
  err.name = 'MulterError';
  err.code = code;
  return err;
}

describe('MulterErrorHandler', () => {
  const handler = new MulterErrorHandler();

  it('detects Multer errors by name', () => {
    expect(handler.canHandle(multerError('LIMIT_FILE_SIZE'))).toBe(true);
    expect(handler.canHandle(new Error('plain'))).toBe(false);
  });

  it('maps a known code to its friendly message and 400 status', () => {
    const res = handler.handle(multerError('LIMIT_FILE_SIZE'));
    expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(res.error).toBe('LIMIT_FILE_SIZE');
    expect(res.message).toBe('File is too large');
  });

  it('falls back to the raw message and UPLOAD_ERROR for an unknown/absent code', () => {
    const res = handler.handle(multerError(undefined, 'weird upload failure'));
    expect(res.error).toBe('UPLOAD_ERROR');
    expect(res.message).toBe('weird upload failure');
  });
});
