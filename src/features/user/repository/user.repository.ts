import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity.js';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IBaseRepository } from '../../../base/base-repository.interface.js';
import { UserCreateType } from '../../../auth/types/user-create.type.js';
import { UserUpdateInfoType } from '../../../auth/types/user-update-info.type.js';
import {
  RepositoryReadException,
  RepositoryWriteException,
} from '../../../common/exceptions/repository-exceptions.js';

@Injectable()
export class UserRepository implements IBaseRepository<
  User,
  UserUpdateInfoType,
  UserCreateType
> {
  constructor(
    @InjectRepository(User) protected usersRepository: Repository<User>,
  ) {}

  public async getById(id: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOneBy({
        id: id,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async findByLogin(login: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOneBy({
        login: login,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOneBy({
        email: email,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async create(data: UserCreateType): Promise<User> {
    try {
      const user = this.usersRepository.create(data);
      return await this.usersRepository.save(user);
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async updateOneById(
    id: string,
    data: UserUpdateInfoType,
  ): Promise<boolean> {
    try {
      const updateResult = await this.usersRepository.update(id, { ...data });
      return !!updateResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async deleteOneById(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.usersRepository.softDelete(id);
      return !!deleteResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async testingDeleteAllRecords(): Promise<boolean> {
    try {
      const deleteResult = await this.usersRepository.deleteAll();
      return !!deleteResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }
}
