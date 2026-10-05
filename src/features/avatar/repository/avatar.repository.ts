import { Injectable } from '@nestjs/common';
import { IBaseRepository } from '../../../base/base-repository.interface.js';
import { Avatar } from '../entity/avatar.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  RepositoryReadException,
  RepositoryWriteException,
} from '../../../common/exceptions/repository-exceptions.js';
import { AvatarCreateType } from '../types/avatar-create.type.js';

type AvatarRepositoryContract = Omit<
  IBaseRepository<Avatar, never, AvatarCreateType>,
  'updateOneById'
>;

@Injectable()
export class AvatarRepository implements AvatarRepositoryContract {
  constructor(
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
  ) {}

  public async getById(id: string): Promise<Avatar | null> {
    try {
      return await this.avatarRepository.findOneBy({
        id,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async getUserAvatars(userId: string): Promise<[Avatar[], number]> {
    try {
      return await this.avatarRepository.findAndCount({
        where: { userId, deletedAt: IsNull() },
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async create(data: AvatarCreateType): Promise<Avatar> {
    try {
      const avatar = this.avatarRepository.create(data);
      return await this.avatarRepository.save(avatar);
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async deleteOneById(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.avatarRepository.softDelete(id);
      return !!deleteResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }
}
