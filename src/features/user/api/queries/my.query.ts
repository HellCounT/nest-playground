import { QueryHandler } from '@nestjs/cqrs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity.js';
import { Repository } from 'typeorm';
import { UserOutputDto } from '../dto/user-output.dto.js';
import { ErrorObjectFactory } from '../../../../common/utils/error-object.factory.js';

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
      throw new UnauthorizedException(
        ErrorObjectFactory.createError('User does not exist', 'userId'),
      );
    } else {
      return UserOutputDto.mapToView(user);
    }
  }
}
