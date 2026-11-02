import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AvatarRepository } from '../../repository/avatar.repository.js';
import { IFileService } from '../../../../providers/files/files.adapter.js';
import { AvatarCleanupResult } from '../api/dto/avatar-cleanup-result.dto.js';
import { AppConfigService } from '../../../../config/app-config.service.js';

@Injectable()
export class AvatarCleanupExecutorService {
  constructor(
    private readonly avatarRepository: AvatarRepository,
    private readonly configService: AppConfigService,
    private readonly fileService: IFileService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AvatarCleanupExecutorService.name);
  }
  async cleanup(): Promise<AvatarCleanupResult> {
    this.logger.debug('Avatar cleanup executor started');
    const batchSize = this.configService.avatarCleanupBatchSize;
    const cutoffDate = new Date(
      Date.now() - this.configService.avatarCleanupRetention,
    );

    let deletedFilesCount: number = 0;
    let failedFilesCount: number = 0;

    let currentBatch = await this.avatarRepository.findExpiredAvatars(
      cutoffDate,
      batchSize,
    );

    let cursor: string;

    while (currentBatch.length > 0) {
      for (const a of currentBatch) {
        try {
          await this.fileService.removeFile({ path: a.fileName });
          await this.avatarRepository.hardDelete(a.id);
          this.logger.debug({ avatarId: a.id }, 'Avatar deleted successfully');
          deletedFilesCount++;
        } catch (e) {
          this.logger.warn(
            { err: e, avatarId: a.id },
            'Avatar deletion failed',
          );
          failedFilesCount++;
        }
      }
      if (currentBatch.length === batchSize) {
        cursor = currentBatch[currentBatch.length - 1].id;
        currentBatch = await this.avatarRepository.findExpiredAvatars(
          cutoffDate,
          batchSize,
          cursor,
        );
      } else {
        break;
      }
    }

    return {
      processed: deletedFilesCount + failedFilesCount,
      deleted: deletedFilesCount,
      failed: failedFilesCount,
    };
  }
}
