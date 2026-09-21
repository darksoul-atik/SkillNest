import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((response) => {
        // If response is already wrapped with data & meta
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          ('meta' in response || Object.keys(response).length <= 2)
        ) {
          return response;
        }

        return { data: response };
      }),
    );
  }
}
