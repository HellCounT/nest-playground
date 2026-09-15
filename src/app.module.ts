import { configModule } from './dynamic-config.module.js';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigService } from './config/app-config.service.js';
import { TestingModule } from '@nestjs/testing';
import { ObserveModule } from './settings/observe.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './features/user/user.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/app-config.module.js';

@Module({
  imports: [
    configModule,
    AppConfigModule,
    CqrsModule,

    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        type: 'postgres',
        url: appConfig.databaseUrl,
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),

    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static async forRoot(appConfig: AppConfigService): Promise<DynamicModule> {
    const additionalModules = [];
    // if (appConfig.includeTestingModule) {
    //   additionalModules.push(TestingModule);
    // }
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
