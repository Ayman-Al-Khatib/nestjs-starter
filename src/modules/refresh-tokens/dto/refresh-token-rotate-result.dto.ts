import { Role } from 'domain/enums/role.enum';
import { RefreshTokenIssueResult } from './refresh-token-issue.dto';

/**
 * Returned by RefreshTokenService.rotate. Carries the new token plus
 * the principal extracted from the old (validated) token so callers
 * don't need to pass userId/role through the request body.
 */
export interface RefreshTokenRotateResult extends RefreshTokenIssueResult {
  userId: number;
  role: Role;
}
