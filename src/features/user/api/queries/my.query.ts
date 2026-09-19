import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity.js';
import { Repository } from 'typeorm';
import { UserOutputDto } from '../dto/user-output.dto.js';
import { UserNotFoundException } from '../../../../common/exceptions/domain-exceptions.js';

export class MeQuery {
  constructor(public userId: string) {}
}

@QueryHandler(MeQuery)
@Injectable()
export class MeQueryHandler {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}
  async execute(query: MeQuery): Promise<UserOutputDto> {
    const user = await this.usersRepository.findOneBy({ id: query.userId });
    if (!user) {
      throw new UserNotFoundException();
    } else {
      return UserOutputDto.mapToView(user);
    }
  }
}
