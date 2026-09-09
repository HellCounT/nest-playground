import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorMessage = {
  statusCode: number;
  field: string;
  message: string;
};

type ErrorResponse = {
  errorsMessages: ErrorMessage[];
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ErrorResponse = {
      errorsMessages: [],
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse.errorsMessages.push({
          statusCode: status,
          field: request.url,
          message: exceptionResponse,
        });
      } else {
        const body = exceptionResponse as {
          message?: string | Array<{ field?: string; message?: string }>;
        };

        if (Array.isArray(body.message)) {
          body.message.forEach((error) => {
            errorResponse.errorsMessages.push({
              statusCode: status,
              field: error.field ?? request.url,
              message: error.message ?? 'Unknown error',
            });
          });
        } else {
          errorResponse.errorsMessages.push({
            statusCode: status,
            field: request.url,
            message: body.message ?? 'Unknown HTTP error',
          });
        }
      }
    } else {
      errorResponse.errorsMessages.push({
        statusCode: status,
        field: request.url,
        message: 'Internal server error',
      });

      console.error(exception);
    }

    response.status(status).json(errorResponse);
  }
}
