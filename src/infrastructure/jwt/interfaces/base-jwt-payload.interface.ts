/**
 * Base interface for JWT payloads containing standard JWT timestamp fields
 */
export interface BaseJwtPayload {
  /** Issued at timestamp (seconds since Unix epoch) */
  iat: number;

  /** Expiration timestamp (seconds since Unix epoch) */
  exp: number;
}
