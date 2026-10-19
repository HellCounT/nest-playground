import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppConfigService } from '../../config/app-config.service.js';
import { createKeyv } from '@keyv/redis';
import { AppCacheService } from './app-cache.service.js';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: (config: AppConfigService) => ({
        stores: [createKeyv(`redis://${config.redisHost}:${config.redisPort}`)],
        ttl: config.cacheTtl,
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
