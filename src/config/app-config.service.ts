import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Matches,
} from 'class-validator';

import { Environments } from './environments.js';
import { configValidationUtility } from './config-validation.utility.js';

@Injectable()
export class AppConfigService {
  // NODE ENVIRONMENT
  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string;

  // OPTIONS: SWAGGER
  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  isSwaggerEnabled: boolean | null;

  // OPTIONS: TESTING MODULE
  @IsBoolean({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule: boolean;

  // APP CONFIGURATION: PORT
  @IsNumber(
    {},
    {
      message: 'CORRECT ENV VARIABLE FOR PORT SHOULD BE PROVIDED',
    },
  )
  port: number;

  // APP CONFIGURATION: DB CONNECTION STRING
  @IsNotEmpty({
    message:
      'CORRECT ENV VARIABLE FOR POSTGRESQL DB CONNECTION SHOULD BE PROVIDED',
  })
  databaseUrl: string;

  // SALT SETTINGS
  @IsNumber(
    {},
    {
      message: 'CORRECT ENV VARIABLE FOR SALT ROUNDS NUMBER SHOULD BE PROVIDED',
    },
  )
  saltRounds: number;

  // ACCESS TOKEN SETTINGS
  @IsNotEmpty({
    message: 'CORRECT ENV VARIABLE FOR ACCESS TOKEN SECRET SHOULD BE PROVIDED',
  })
  secretAccessToken: string;

  @Matches(/^\d+m$/, {
    message:
      'CORRECT ENV VARIABLE FOR ACCESS TOKEN LIFETIME SHOULD BE PROVIDED',
  })
  lifetimeAccessToken: string;

  // REFRESH TOKEN SETTINGS
  @IsNotEmpty({
    message: 'CORRECT ENV VARIABLE FOR REFRESH TOKEN SECRET SHOULD BE PROVIDED',
  })
  secretRefreshToken: string;

  @Matches(/^\d+m$/, {
    message:
      'CORRECT ENV VARIABLE FOR REFRESH TOKEN LIFETIME SHOULD BE PROVIDED',
  })
  lifetimeRefreshToken: string;

  constructor(private readonly configService: ConfigService) {
    this.env = this.configService.get<string>('NODE_ENV')!;

    this.isSwaggerEnabled = configValidationUtility.convertToBoolean(
      this.configService.get('IS_SWAGGER_ENABLED'),
    ) as boolean;

    this.includeTestingModule = configValidationUtility.convertToBoolean(
      this.configService.get('INCLUDE_TESTING_MODULE'),
    ) as boolean;

    this.port = Number(this.configService.get('PORT'));

    this.databaseUrl = this.configService.get<string>('DATABASE_URL')!;

    this.saltRounds = Number(
      this.configService.get('ROUND_SALT_FOR_HASHPASSWORD'),
    );

    this.secretAccessToken = this.configService.get<string>(
      'SECRET_ACCESS_TOKEN',
    )!;

    this.lifetimeAccessToken = this.configService.get<string>(
      'EXPIRATION_ACCESS_TOKEN',
    )!;

    this.secretRefreshToken = this.configService.get<string>(
      'SECRET_REFRESH_TOKEN',
    )!;

    this.lifetimeRefreshToken = this.configService.get<string>(
      'EXPIRATION_REFRESH_TOKEN',
    )!;

    configValidationUtility.validateConfig(this);
  }
}
