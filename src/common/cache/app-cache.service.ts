import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { REDIS_CLIENT } from './constants/redis-client.token.js';
import { PinoLogger } from 'nestjs-pino';
import type { RedisClient } from './redis/redis.factories.js';

@Injectable()
export class AppCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppCacheService.name);
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.warn(
        {
          error,
          key,
        },
        'Cache GET failed, fallback to DB',
      );
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set<T>(key, value, ttl);
    } catch (error) {
      this.logger.warn(
        {
          error,
          key,
        },
        'Cache SET failed, continuing with no cache',
      );
    }
  }

  async delete<T>(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(
        {
          error,
          key,
        },
        'Cache invalidation failed',
      );
    }
  }

  async getUsersListVersion(): Promise<string | undefined> {
    try {
      return (await this.redisClient.get('users:list:version')) ?? '0';
    } catch (error) {
      this.logger.warn(error, 'Failed to read users list version');
      return undefined;
    }
  }

  async invalidateUsersLists(): Promise<void> {
    try {
      await this.redisClient.incr('users:list:version');
    } catch (error) {
      this.logger.error(error, 'Failed to invalidate users list version');
    }
  }
}
