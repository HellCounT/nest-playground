import { User } from '../../entity/user.entity.js';
import { ApiProperty } from '@nestjs/swagger';

export class UserOutputDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    example: 'andy528321',
  })
  login: string;

  @ApiProperty({
    example: 'andy@test.com',
  })
  email: string;

  @ApiProperty({
    example: 35,
  })
  age: number;

  @ApiProperty({
    example: 'Backend developer',
  })
  description: string;

  @ApiProperty({
    example: '2026-09-15T14:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-09-15T14:30:00.000Z',
  })
  updatedAt: string;

  static mapToView(user: User): UserOutputDto {
    const dto = new UserOutputDto();

    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.age = user.age;
    dto.description = user.description;
    dto.createdAt = user.createdAt.toISOString();
    dto.updatedAt = user.updatedAt.toISOString();

    return dto;
  }
}
