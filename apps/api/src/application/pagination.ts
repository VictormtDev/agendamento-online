export interface Pagination {
  page: number;
  perPage: number;
}

export interface Page<T> {
  data: T[];
  meta: Pagination & { total: number };
}
