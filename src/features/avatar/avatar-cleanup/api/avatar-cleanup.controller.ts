import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AvatarCleanupService } from '../domain/avatar-cleanup.service.js';

@Controller('avatar-cleanup')
export class AvatarCleanupController {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('trigger')
  async triggerCleanup() {
    await this.avatarCleanupService.enqueueCleanup();
  }
}
