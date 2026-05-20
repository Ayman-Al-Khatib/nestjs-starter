/**
 * Metadata block returned alongside every paginated response. All
 * derivative fields (`totalPages`, `hasNextPage`, `prevPage`, …) are
 * pre-computed by the `paginate()` utility so clients never need to
 * recompute them — the shape is meant to be rendered directly.
 */
export interface PaginationMeta {
  /** Total number of matching rows across all pages. */
  total: number;
  /** 1-based current page number (always clamped to `>= 1`). */
  page: number;
  /** Page size applied to this response (always clamped to `[1, MAX_LIMIT]`). */
  limit: number;
  /** `Math.ceil(total / limit)` — at least `0` when `total === 0`. */
  totalPages: number;
  /** Next page number, or `null` when on the last page. */
  nextPage: number | null;
  /** Previous page number, or `null` when on the first page. */
  prevPage: number | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
