import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exception.filter.js';
import cookieParser from 'cookie-parser';

type ErrorResponseType = {
  field: string;
  message: string;
};

export const applyAppSettings = (app: INestApplication) => {
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
    //optionsSuccessStatus: 204,
  });
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const errorForResponse: ErrorResponseType[] = [];
        errors.forEach((error) => {
          Object.values(error.constraints ?? {}).forEach((message) => {
            errorForResponse.push({
              field: error.property,
              message,
            });
          });
        });
        throw new BadRequestException(errorForResponse);
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
};
