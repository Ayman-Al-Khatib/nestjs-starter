import { PaginationMeta } from './pagination-meta.interface';

/**
 * Generic envelope returned by every paginated endpoint. The
 * repository / service layers produce this with raw entity rows; a
 * controller typically maps `data` into a response-DTO array (via
 * `mapPaginated` / `mapPaginatedAsync`) before returning to the
 * client. The `pagination` block is identical across modules.
 */
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
