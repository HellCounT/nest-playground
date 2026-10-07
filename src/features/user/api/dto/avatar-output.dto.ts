import { Avatar } from '../../../avatar/entity/avatar.entity.js';
import { ApiProperty } from '@nestjs/swagger';

export class AvatarOutputDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    example: 'avatar.jpg',
  })
  fileName: string;

  @ApiProperty({
    example: '2026-09-15T14:30:00.000Z',
  })
  createdAt: string;

  static mapToView(avatar: Avatar): AvatarOutputDto {
    const dto = new AvatarOutputDto();

    dto.id = avatar.id;
    dto.fileName = avatar.fileName;
    dto.createdAt = avatar.createdAt.toISOString();

    return dto;
  }
}
