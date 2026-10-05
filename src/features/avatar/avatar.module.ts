import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from './entity/avatar.entity.js';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AvatarController } from './api/avatar.controller.js';
import { AvatarRepository } from './repository/avatar.repository.js';
import { DeleteAvatarHandler } from './domain/use-cases/delete-avatar.command.js';
import { UploadAvatarHandler } from './domain/use-cases/upload-avatar.command.js';

@Module({
  imports: [TypeOrmModule.forFeature([Avatar]), CqrsModule],
  controllers: [AvatarController],
  providers: [AvatarRepository, DeleteAvatarHandler, UploadAvatarHandler],
})
export class AvatarModule {}
