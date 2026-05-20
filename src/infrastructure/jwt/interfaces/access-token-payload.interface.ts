import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for storing data in access tokens
 * Used for authenticating API requests
 */
export interface AccessTokenPayload {
  userId: number;
  role?: string;
}

/**
 * Payload retrieved from decoded access tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedAccessTokenPayload extends AccessTokenPayload, BaseJwtPayload {}
