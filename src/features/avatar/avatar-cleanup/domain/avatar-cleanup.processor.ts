import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { Job } from 'bullmq';
import { AvatarCleanupExecutorService } from './avatar-cleanup-executor.service.js';
import { AvatarCleanupResult } from '../api/dto/avatar-cleanup-result.dto.js';
import { setTimeout } from 'node:timers/promises';

@Processor('avatar-cleanup')
export class AvatarCleanupProcessor extends WorkerHost {
  constructor(
    private readonly executor: AvatarCleanupExecutorService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(AvatarCleanupProcessor.name);
  }
  async process(job: Job): Promise<AvatarCleanupResult> {
    try {
      const result = await this.executor.cleanup();
      this.logger.info(
        { id: job.id, result },
        'Avatar cleanup process executed',
      );
      await setTimeout(60_000);
      return result;
    } catch (error) {
      this.logger.error(
        { id: job.id, err: error },
        'Avatar cleanup process failed with error',
      );
      throw error;
    }
  }
}
