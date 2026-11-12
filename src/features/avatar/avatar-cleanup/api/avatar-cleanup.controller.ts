import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AvatarCleanupService } from '../domain/avatar-cleanup.service.js';
import { AccessTokenGuard } from '../../../../common/guards/access-token.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../auth/types/user-roles.enum.js';

@Controller('avatar-cleanup')
export class AvatarCleanupController {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('trigger')
  async triggerCleanup() {
    await this.avatarCleanupService.enqueueCleanup();
  }
}
