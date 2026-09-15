import { User } from '../../entity/user.entity.js';

export class UserOutputDto {
  id: string;
  login: string;
  email: string;
  age: number;
  description: string;
  createdAt: string;
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
