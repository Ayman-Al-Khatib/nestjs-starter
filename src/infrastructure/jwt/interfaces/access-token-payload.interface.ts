import { Role } from 'domain/enums/role.enum';
import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for storing data in access tokens
 * Used for authenticating API requests
 */
export interface AccessTokenPayload {
  userId: number;
  role: Role;
}

/**
 * Payload retrieved from decoded access tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedAccessTokenPayload extends AccessTokenPayload, BaseJwtPayload {}
