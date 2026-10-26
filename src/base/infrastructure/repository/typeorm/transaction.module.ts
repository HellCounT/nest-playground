import { Global, Module } from '@nestjs/common';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager.js';
import { TransactionContext } from './transaction-context.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_MANAGER } from '../../../../application/transaction-manager.interface.js';

@Global()
@Module({
  imports: [TypeOrmModule],
  providers: [
    TransactionContext,
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManager },
  ],
  exports: [TransactionContext, TRANSACTION_MANAGER],
})
export class TransactionModule {}
