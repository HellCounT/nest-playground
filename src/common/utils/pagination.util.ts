import { Injectable } from '@nestjs/common';

export type Paginated<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

@Injectable()
export class PaginationUtil {
  getOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  getPagesCount(totalCount: number, pageSize: number): number {
    return Math.ceil(totalCount / pageSize);
  }

  getPaginatedResult<T>(
    page: number,
    pageSize: number,
    totalCount: number,
    items: T[],
  ): Paginated<T> {
    return {
      pagesCount: this.getPagesCount(totalCount, pageSize),
      page,
      pageSize,
      totalCount,
      items,
    };
  }
}
