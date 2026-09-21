import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { nanoid } from 'nanoid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || nanoid(10);
    const timestamp = new Date().toISOString();
    const path = request.url;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof ZodValidationException) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      const zodError = exception.getZodError();
      message = 'Validation failed';
      details = zodError.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj['message'] as string | string[]) || exception.message;
        error = (obj['error'] as string) || exception.name;
        details = obj['details'];
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[${requestId}] Unhandled Exception: ${exception.message}`, exception.stack);
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
        details = exception.stack;
      }
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      ...(details ? { details } : {}),
      path,
      timestamp,
      requestId,
    });
  }
}
