/**
 * Single source of truth for offset-pagination bounds. The query DTO
 * uses these as defaults and as the `Max(...)` upper-bound, and the
 * `paginate()` utility re-clamps with the same numbers as defense in
 * depth for callers that bypass the DTO (seeders, scripts, internal
 * jobs).
 */

/** Default page number when the caller omits `?page=`. */
export const DEFAULT_PAGE = 1;

/** Default page size when the caller omits `?limit=`. */
export const DEFAULT_LIMIT = 10;

/**
 * Hard upper bound on page size. Chosen to keep `SELECT … LIMIT n`
 * responses bounded under realistic database load and to make
 * accidental large-payload responses impossible.
 */
export const MAX_LIMIT = 50;
