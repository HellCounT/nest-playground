export interface ITransactionManager {
  run<T>(operation: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');
