import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AVATAR_CLEANUP_DEDUPLICATION_ID } from '../constants/avatar-cleanup-deduplication.id.constant.js';

@Injectable()
export class AvatarCleanupService {
  constructor(
    @InjectQueue('avatar-cleanup') private avatarCleanupQueue: Queue,
  ) {}

  async enqueueCleanup() {
    return await this.avatarCleanupQueue.add(
      'cleanup',
      {},
      { deduplication: { id: AVATAR_CLEANUP_DEDUPLICATION_ID } },
    );
  }
}
