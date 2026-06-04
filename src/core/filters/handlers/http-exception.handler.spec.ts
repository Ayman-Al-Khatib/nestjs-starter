import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionHandler } from './http-exception.handler';

describe('HttpExceptionHandler', () => {
  const handler = new HttpExceptionHandler();

  it('handles only HttpExceptions', () => {
    expect(handler.canHandle(new NotFoundException())).toBe(true);
    expect(handler.canHandle(new Error('plain'))).toBe(false);
  });

  it('preserves the status code and message of a thrown HttpException', () => {
    const res = handler.handle(new ConflictException('already exists'));
    expect(res.statusCode).toBe(409);
    expect(res.message).toBe('already exists');
  });

  it('unwraps a single-element validation message array', () => {
    const res = handler.handle(new BadRequestException({ message: ['field is required'] }));
    expect(res.message).toBe('field is required');
  });

  it('keeps a multi-element validation message array intact', () => {
    const res = handler.handle(
      new BadRequestException({ message: ['a is required', 'b is invalid'] }),
    );
    expect(res.message).toEqual(['a is required', 'b is invalid']);
  });

  it('honors a custom error code carried in the response payload', () => {
    const res = handler.handle(new BadRequestException({ message: 'bad', error: 'CUSTOM_CODE' }));
    expect(res.error).toBe('CUSTOM_CODE');
  });
});
