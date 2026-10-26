import { EntityManager } from 'typeorm';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionContext {
  private readonly asyncLocalStorage = new AsyncLocalStorage<EntityManager>();

  getManager(): EntityManager | undefined {
    return this.asyncLocalStorage.getStore();
  }

  run<T>(manager: EntityManager, operation: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(manager, operation);
  }
}
