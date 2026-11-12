import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from './entity/avatar.entity.js';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AvatarController } from './api/avatar.controller.js';
import { AvatarRepository } from './repository/avatar.repository.js';
import { DeleteAvatarHandler } from './domain/use-cases/delete-avatar.command.js';
import { UploadAvatarHandler } from './domain/use-cases/upload-avatar.command.js';
import { FilesModule } from '../../providers/files/files.module.js';
import { UserModule } from '../user/user.module.js';
import { JwtModule } from '../../common/jwt/jwt.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avatar]),
    CqrsModule,
    FilesModule,
    UserModule,
    JwtModule,
  ],
  controllers: [AvatarController],
  providers: [AvatarRepository, DeleteAvatarHandler, UploadAvatarHandler],
  exports: [AvatarRepository],
})
export class AvatarModule {}
