export interface IBaseRepository<T, C, U> {
  create(data: C): Promise<T | null>;
  getById(id: string): Promise<T | null>;
  updateOneById(id: string, data: U): Promise<boolean>;
  deleteOneById(id: string): Promise<boolean>;
}
