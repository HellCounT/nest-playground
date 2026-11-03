import { DataSource } from 'typeorm';
import { TransactionContext } from './transaction-context.js';
import { Injectable } from '@nestjs/common';
import { ITransactionManager } from '../../../../application/transaction-manager.interface.js';

@Injectable()
export class TypeOrmTransactionManager implements ITransactionManager {
  constructor(
    private readonly transactionContext: TransactionContext,
    private readonly dataSource: DataSource,
  ) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    const manager = this.transactionContext.getManager();

    if (manager) {
      return operation();
    }

    return this.dataSource.transaction(async (manager) => {
      return this.transactionContext.run(manager, operation);
    });
  }
}
