import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity.js';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IBaseRepository } from '../../../base/infrastructure/repository/base-repository.interface.js';
import { UserCreateType } from '../../auth/types/user-create.type.js';
import { UserUpdateInfoType } from '../../auth/types/user-update-info.type.js';
import {
  RepositoryReadException,
  RepositoryWriteException,
} from '../../../common/exceptions/repository-exceptions.js';
import { TransactionContext } from '../../../base/infrastructure/repository/typeorm/transaction-context.js';

@Injectable()
export class UserRepository implements IBaseRepository<
  User,
  UserUpdateInfoType,
  UserCreateType
> {
  constructor(
    @InjectRepository(User) protected usersRepository: Repository<User>,
    private readonly transactionContext: TransactionContext,
  ) {}

  protected get repository(): Repository<User> {
    const manager = this.transactionContext.getManager();
    return manager ? manager.getRepository(User) : this.usersRepository;
  }

  public async getById(id: string): Promise<User | null> {
    try {
      return await this.repository.findOneBy({
        id: id,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async findByLogin(login: string): Promise<User | null> {
    try {
      return await this.repository.findOneBy({
        login: login,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.repository.findOneBy({
        email: email,
        deletedAt: IsNull(),
      });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async create(data: UserCreateType): Promise<User> {
    try {
      const repository = this.repository;
      const user = repository.create(data);
      return await repository.save(user);
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async updateOneById(
    id: string,
    data: UserUpdateInfoType,
  ): Promise<boolean> {
    try {
      const updateResult = await this.repository.update(id, { ...data });
      return !!updateResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async deleteOneById(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.repository.softDelete(id);
      return !!deleteResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async debitIfSufficient(id: string, amount: string): Promise<boolean> {
    try {
      const updateResult = await this.repository
        .createQueryBuilder()
        .update(User)
        .set({ balance: () => '"balance" - :amount' })
        .where('"id" = :id', { id })
        .andWhere('"deletedAt" IS NULL')
        .andWhere('"balance" >= :amount')
        .setParameter('amount', amount)
        .execute();
      return !!updateResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async credit(id: string, amount: string): Promise<boolean> {
    try {
      const updateResult = await this.repository
        .createQueryBuilder()
        .update(User)
        .set({ balance: () => '"balance" + :amount' })
        .where('"id" = :id', { id })
        .andWhere('"deletedAt" IS NULL')
        .setParameter('amount', amount)
        .execute();

      return !!updateResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async testingDeleteAllRecords(): Promise<boolean> {
    try {
      const deleteResult = await this.repository.deleteAll();
      return !!deleteResult.affected;
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }
}
