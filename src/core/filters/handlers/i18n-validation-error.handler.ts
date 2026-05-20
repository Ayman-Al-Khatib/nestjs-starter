import { Injectable } from '@nestjs/common';
import { I18nValidationError, I18nValidationException } from 'nestjs-i18n';
import { BaseErrorHandler } from '../base/base-error.handler';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Injectable()
export class I18nValidationErrorHandler extends BaseErrorHandler {
  canHandle(error: unknown): boolean {
    return error instanceof I18nValidationException;
  }

  handle(error: I18nValidationException): ErrorResponse {
    const messages = this.flattenMessages(error.errors ?? []);
    return this.buildResponse({
      statusCode: error.getStatus(),
      error: 'BAD_REQUEST',
      message: messages.length === 1 ? messages[0] : messages,
    });
  }

  private flattenMessages(errors: I18nValidationError[]): string[] {
    const out: string[] = [];
    const walk = (errs: I18nValidationError[]): void => {
      for (const e of errs) {
        if (e.constraints) {
          for (const msg of Object.values(e.constraints)) {
            if (typeof msg === 'string') out.push(msg);
          }
        }
        if (e.children?.length) walk(e.children);
      }
    };
    walk(errors);
    return out;
  }
}
