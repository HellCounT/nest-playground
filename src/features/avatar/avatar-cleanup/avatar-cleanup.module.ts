import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../../../config/app-config.service.js';
import { AvatarCleanupService } from './domain/avatar-cleanup.service.js';
import { AvatarCleanupProcessor } from './domain/avatar-cleanup.processor.js';
import { AvatarCleanupExecutorService } from './domain/avatar-cleanup-executor.service.js';
import { FilesModule } from '../../../providers/files/files.module.js';
import { AvatarCleanupController } from './api/avatar-cleanup.controller.js';
import { AvatarCleanupScheduler } from './domain/avatar-cleanup.scheduler.js';
import { AvatarModule } from '../avatar.module.js';
import { UserModule } from '../../user/user.module.js';
import { JwtModule } from '../../../common/jwt/jwt.module.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: { host: config.redisHost, port: config.redisPort },
      }),
    }),
    BullModule.registerQueue({
      name: 'avatar-cleanup',
    }),
    AvatarModule,
    FilesModule,
    UserModule,
    JwtModule,
  ],
  controllers: [AvatarCleanupController],
  providers: [
    AvatarCleanupService,
    AvatarCleanupProcessor,
    AvatarCleanupExecutorService,
    AvatarCleanupScheduler,
  ],
})
export class AvatarCleanupModule {}
