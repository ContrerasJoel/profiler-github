import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Unifica la forma de *todos* los errores del API. El frontend puede confiar en que
 * cualquier fallo (404, 400, 429, 503 o un crash inesperado) llega con la misma
 * estructura, en vez de tener que adivinar entre el formato de Nest y el de un throw suelto.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Ocurrió un error inesperado en el servidor.';
    let error = 'Internal Server Error';

    if (isHttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
        error = exception.name;
      } else if (payload && typeof payload === 'object') {
        const parsed = payload as { message?: string | string[]; error?: string };
        message = parsed.message ?? exception.message;
        error = parsed.error ?? exception.name;
      }
    }

    // Solo los 5xx son bugs nuestros: se loguean con stack. El resto es ruido esperable.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status}: ${String(message)}`);
    }

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
