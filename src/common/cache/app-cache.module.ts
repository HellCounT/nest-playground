import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppConfigService } from '../../config/app-config.service.js';
import { AppCacheService } from './app-cache.service.js';
import { REDIS_CLIENT } from './constants/redis-client.token.js';
import { PinoLogger } from 'nestjs-pino';
import {
  createCacheStore,
  createNativeRedisClient,
} from './redis/redis.factories.js';
import { RedisClientType } from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [AppConfigService, PinoLogger],
      useFactory: (config: AppConfigService, logger: PinoLogger) => ({
        stores: [createCacheStore(config, logger)],
        ttl: config.cacheTtl,
      }),
    }),
  ],
  providers: [
    AppCacheService,
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService, PinoLogger],
      useFactory: (
        config: AppConfigService,
        logger: PinoLogger,
      ): RedisClientType => createNativeRedisClient(config, logger),
    },
  ],
  exports: [AppCacheService, REDIS_CLIENT],
})
export class AppCacheModule {}
