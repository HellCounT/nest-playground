import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service.js';
import { configModule } from '../dynamic-config.module.js';

@Global()
@Module({
  imports: [configModule],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
