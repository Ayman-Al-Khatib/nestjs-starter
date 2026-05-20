/**
 * Input options accepted by the `paginate()` utility. Both fields are
 * optional — the function falls back to `DEFAULT_PAGE` / `DEFAULT_LIMIT`
 * and clamps `limit` to `MAX_LIMIT` from `pagination.constants.ts`.
 *
 * `PaginationQueryDto` (and any subclass) structurally satisfies this
 * shape, so controllers can pass the validated query object directly:
 *
 * @example
 *   paginate(qb, query); // equivalent to paginate(qb, { page: query.page, limit: query.limit })
 */
export interface IPaginationOptions {
  page?: number;
  limit?: number;
}
