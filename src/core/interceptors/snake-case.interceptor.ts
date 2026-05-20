import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CASE_FORMAT_HEADER, CaseConverterUtils, SNAKE_CASE } from 'shared/utils/case-converter.utils';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const caseFormat = (request.headers[CASE_FORMAT_HEADER] as string | undefined)?.toLowerCase();

    return next.handle().pipe(
      map((data) => (caseFormat === SNAKE_CASE ? CaseConverterUtils.toSnakeCase(data) : data)),
    );
  }
}
