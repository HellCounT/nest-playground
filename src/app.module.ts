import { configModule } from './dynamic-config.module.js';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigService } from './config/app-config.service.js';
import { TestingModule } from '@nestjs/testing';
import { ObserveModule } from './settings/observe.js';

@Module({
  imports: [CqrsModule, configModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static async forRoot(appConfig: AppConfigService): Promise<DynamicModule> {
    const additionalModules = [];
    if (appConfig.includeTestingModule) {
      additionalModules.push(TestingModule);
    }
    if (appConfig.includeObserveModule) {
      additionalModules.push(
        ObserveModule.forRoot({
          appKey: appConfig.observeAppKey,
          appSecret: appConfig.observeAppSecret,
          serviceId: 'nest-playground',
        }),
      );
    }
    return {
      module: AppModule,
      imports: additionalModules, // Add dynamic modules here
    };
  }
}
