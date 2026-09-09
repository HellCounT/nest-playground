import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IBaseRepository } from '../../../base/base-repository.interface.js';

type UpdateInfo = {
  email?: string;
  hash?: string;
  description?: string;
};

@Injectable()
export class UserRepository implements IBaseRepository<User, UpdateInfo> {
  constructor(@InjectRepository(User) protected usersRepo: Repository<User>) {}

  public async getById(id: string): Promise<User | null> {
    try {
      return await this.usersRepo.findOneBy({ id: id });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async findByLogin(login: string): Promise<User | null> {
    try {
      return await this.usersRepo.findOneBy({ login });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepo.findOneBy({ email });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async create(data: User): Promise<User | null> {
    try {
      return this.usersRepo.create(data);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async updateOneById(id: string, data: UpdateInfo): Promise<boolean> {
    try {
      const updateResult = await this.usersRepo.update(id, { ...data });
      return !!updateResult.affected;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  public async deleteOneById(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.usersRepo.delete(id);
      return !!deleteResult.affected;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
