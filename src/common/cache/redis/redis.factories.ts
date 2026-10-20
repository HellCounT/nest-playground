import { AppConfigService } from '../../../config/app-config.service.js';
import { PinoLogger } from 'nestjs-pino';
import { createClient, createKeyv } from '@keyv/redis';

export type RedisClient = ReturnType<typeof createClient>;

export function createNativeRedisClient(
  config: AppConfigService,
  logger: PinoLogger,
) {
  const client = createClient({
    url: `redis://${config.redisHost}:${config.redisPort}`,
    socket: {
      connectTimeout: 500,
      reconnectStrategy: (retries) =>
        Math.min(100 * 2 ** Math.min(retries, 5), 2000),
    },
    disableOfflineQueue: true,
  });

  client.on('error', (error) => {
    logger.warn({ err: error }, 'Redis client error');
  });

  // Не блокируем запуск NestJS ожиданием Redis.
  void client.connect().catch((error: unknown) => {
    logger.error({ err: error }, 'Redis client connection failed');
  });

  return client;
}

export function createCacheStore(config: AppConfigService, logger: PinoLogger) {
  const keyv = createKeyv(`redis://${config.redisHost}:${config.redisPort}`, {
    connectionTimeout: 500,
    throwOnConnectError: true,
    throwOnErrors: true,
  });

  keyv.on('error', (error) => {
    logger.warn({ err: error }, 'Redis cache error');
  });

  return keyv;
}
