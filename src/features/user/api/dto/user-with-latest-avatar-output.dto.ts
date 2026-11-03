import { Avatar } from '../../../avatar/entity/avatar.entity.js';
import { User } from '../../entity/user.entity.js';
import { UserOutputDto } from './user-output.dto.js';
import { ApiProperty } from '@nestjs/swagger';
import { AvatarOutputDto } from './avatar-output.dto.js';

export type UserWithLatestAvatar = User & {
  latestAvatar: Avatar | null;
};

export class UserWithLatestAvatarOutputDto extends UserOutputDto {
  @ApiProperty({
    type: AvatarOutputDto,
    nullable: true,
  })
  latestAvatar: AvatarOutputDto;

  static mapToView(user: UserWithLatestAvatar): UserWithLatestAvatarOutputDto {
    const baseDto = UserOutputDto.mapToView(user);

    const dto = Object.assign(new UserWithLatestAvatarOutputDto(), baseDto);

    dto.latestAvatar = dto.latestAvatar = AvatarOutputDto.mapToView(
      user.latestAvatar,
    );

    return dto;
  }
}
