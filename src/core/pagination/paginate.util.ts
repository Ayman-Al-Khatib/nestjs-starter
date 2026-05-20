import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from './pagination.constants';
import { IPaginatedResponse } from './interfaces/paginated-response.interface';
import { IPaginationOptions } from './interfaces/pagination-options.interface';
import { PaginationMeta } from './interfaces/pagination-meta.interface';

/**
 * Executes a paginated query and returns the standard `{ data, pagination }`
 * envelope. The page / limit are clamped to safe bounds (`page >= 1`,
 * `1 <= limit <= MAX_LIMIT`) before hitting the database — `PaginationQueryDto`
 * already enforces this in HTTP flows, but the clamp keeps the function
 * safe when called from seeders, scripts, or background jobs where input
 * may not be validated.
 *
 * @example
 *   // In a repository:
 *   findPageForUser(userId: number, query: PaginationQueryDto) {
 *     const qb = this.repo.createQueryBuilder('x').where(...).orderBy(...);
 *     return paginate(qb, query); // PaginationQueryDto is an IPaginationOptions
 *   }
 */
export async function paginate<Entity extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<Entity>,
  options: IPaginationOptions,
): Promise<IPaginatedResponse<Entity>> {
  const page = Math.max(options.page ?? DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

  return { data, pagination: buildPaginationMeta(total, page, limit) };
}

/**
 * Synchronously transforms each item of a paginated response (typically
 * mapping entities to response DTOs) and returns a new envelope that
 * preserves the `pagination` block. Use this in controllers to remove
 * the `{ ...result, data: result.data.map(...) }` boilerplate.
 *
 * @example
 *   return mapPaginated(result, UserResponseDto.fromEntity);
 */
export function mapPaginated<S, T>(
  result: IPaginatedResponse<S>,
  mapper: (item: S, index: number) => T,
): IPaginatedResponse<T> {
  return { data: result.data.map(mapper), pagination: result.pagination };
}

/**
 * Async sibling of `mapPaginated` for mappers that need to await
 * (storage URL signing, related-entity hydration, …). Runs the mappers
 * in parallel via `Promise.all` while preserving input order.
 *
 * @example
 *   return mapPaginatedAsync(result, (user) =>
 *     this.userService.buildResponseDto(user),
 *   );
 */
export async function mapPaginatedAsync<S, T>(
  result: IPaginatedResponse<S>,
  mapper: (item: S, index: number) => Promise<T>,
): Promise<IPaginatedResponse<T>> {
  const data = await Promise.all(result.data.map(mapper));
  return { data, pagination: result.pagination };
}

function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  return {
    total,
    page,
    limit,
    totalPages,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
    hasNextPage,
    hasPrevPage,
  };
}
