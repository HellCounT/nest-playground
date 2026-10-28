import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MoneyTransfer } from '../entity/money-transfer.entity.js';
import { TransactionContext } from '../../../base/infrastructure/repository/typeorm/transaction-context.js';
import { MoneyTransferCreateType } from '../types/money-transfer-create.type.js';
import {
  RepositoryReadException,
  RepositoryWriteException,
} from '../../../common/exceptions/repository-exceptions.js';

export class MoneyTransferRepository {
  constructor(
    @InjectRepository(MoneyTransfer)
    protected moneyTransferRepository: Repository<MoneyTransfer>,
    private readonly transactionContext: TransactionContext,
  ) {}

  protected get repository(): Repository<MoneyTransfer> {
    const manager = this.transactionContext.getManager();
    return manager
      ? manager.getRepository(MoneyTransfer)
      : this.moneyTransferRepository;
  }

  public async create(data: MoneyTransferCreateType): Promise<MoneyTransfer> {
    try {
      const repository = this.repository;
      const moneyTransfer = repository.create(data);
      return await repository.save(moneyTransfer);
    } catch (e) {
      throw new RepositoryWriteException(e);
    }
  }

  public async findBySenderAndIdempotencyKey(
    senderId: string,
    idempotencyKey: string,
  ): Promise<MoneyTransfer | null> {
    try {
      return await this.repository.findOneBy({ senderId, idempotencyKey });
    } catch (e) {
      throw new RepositoryReadException(e);
    }
  }

  public async tryRegister(data: MoneyTransferCreateType): Promise<boolean> {
    try {
      const result = await this.repository
        .createQueryBuilder()
        .insert()
        .into(MoneyTransfer)
        .values(data)
        .orIgnore()
        .returning(['id'])
        .execute();
      return result.raw.length === 1;
    } catch (e) {
      {
        throw new RepositoryWriteException(e);
      }
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
