import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { CronJob } from 'cron';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { Environments } from '../../../../config/environments.js';

@Injectable()
export class AvatarCleanupScheduler implements OnApplicationBootstrap {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly avatarCleanupService: AvatarCleanupService,
    private readonly config: AppConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AvatarCleanupScheduler.name);
  }
  onApplicationBootstrap() {
    if (this.config.env === Environments.TESTING) {
      this.logger.debug(
        'Avatar cleanup scheduler disabled in testing environment',
      );
      return;
    }

    const jobName = 'avatar-cleanup';
    const schedule = this.config.avatarCleanupCronSchedule;

    try {
      const job = new CronJob(schedule, async () => {
        try {
          this.logger.debug(
            { jobName, schedule },
            `Queuing job ${jobName} with schedule ${schedule}`,
          );
          await this.avatarCleanupService.enqueueCleanup();
        } catch (e) {
          this.logger.error(
            { jobName, err: e },
            `Failed to queue job ${jobName}`,
          );
        }
      });

      this.schedulerRegistry.addCronJob(jobName, job);

      job.start();

      this.logger.info(
        { jobName, schedule },
        `Job ${jobName} started with the schedule ${schedule}`,
      );
    } catch (e) {
      this.logger.error(
        { jobName, err: e },
        `Failed to start cron job ${jobName}`,
      );
      throw e;
    }
  }
}
