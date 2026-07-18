import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface Response<T> {
  success: true;
  data: T;
}

/**
 * Wraps every successful controller return value in `{ success: true, data: <payload> }`
 * so all API responses share a consistent envelope. Errors are handled separately by
 * HttpExceptionFilter, which emits `{ success: false, ... }`.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
