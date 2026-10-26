import { configModule } from './dynamic-config.module.js';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigService } from './config/app-config.service.js';
import { ObserveModule } from './settings/observe.js';
import { AuthModule } from './features/auth/auth.module.js';
import { UserModule } from './features/user/user.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/app-config.module.js';
import { AvatarModule } from './features/avatar/avatar.module.js';
import { LoggingModule } from './common/logger/logging.module.js';
import { AppCacheModule } from './common/cache/app-cache.module.js';
import { TransactionModule } from './base/infrastructure/repository/typeorm/transaction.module.js';

@Module({
  imports: [
    configModule,
    AppConfigModule,
    AppCacheModule,
    LoggingModule,
    CqrsModule,
    TransactionModule,

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
    AvatarModule,
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
