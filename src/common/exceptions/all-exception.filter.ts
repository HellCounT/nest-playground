import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RepositoryException } from './repository-exceptions.js';
import {
  DomainException,
  domainExceptionStatusMap,
  UserAlreadyExistsException,
} from './domain-exceptions.js';

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

    const errorResponse: ErrorResponse = {
      errorsMessages: [],
    };

    if (exception instanceof RepositoryException) {
      console.error(exception);
      console.error(exception.cause);

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        errorsMessages: [
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            field: request.url,
            message: 'Internal server error',
          },
        ],
      });
    }

    if (exception instanceof DomainException) {
      const status =
        domainExceptionStatusMap[exception.code] ?? HttpStatus.BAD_REQUEST;

      if (exception instanceof UserAlreadyExistsException) {
        return response.status(status).json({
          errorsMessages: [
            {
              statusCode: status,
              field: request.url,
              message: 'Unable to create user with provided credentials',
            },
          ],
        });
      }

      return response.status(status).json({
        errorsMessages: [
          {
            statusCode: status,
            field: exception.field ?? request.url,
            message: exception.message,
          },
        ],
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
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

      return response.status(status).json(errorResponse);
    }

    errorResponse.errorsMessages.push({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      field: request.url,
      message: 'Internal server error',
    });
    console.log(exception);
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(errorResponse);
  }
}
