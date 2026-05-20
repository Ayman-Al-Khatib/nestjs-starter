import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface TransformedResponse<T> {
  data: T;
  pagination?: unknown;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((response: any) => {
        const data = response?.data ?? response;
        const pagination = response?.pagination;

        return {
          data,
          ...(pagination && { pagination }),
        };
      }),
    );
  }
}
