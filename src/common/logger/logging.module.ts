import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from '../../config/app-config.module.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { createLoggingConfig } from './logging.config.js';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        return createLoggingConfig({
          level: config.logLevel,
          pretty: config.logPretty ?? true,
          http: config.logHttp ?? true,
        });
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
