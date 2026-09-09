export interface IBaseRepository<T, U> {
  create(data: T): Promise<T | null>;
  getById(id: string): Promise<T | null>;
  updateOneById(id: string, data: U): Promise<boolean>;
  deleteOneById(id: string): Promise<boolean>;
}
