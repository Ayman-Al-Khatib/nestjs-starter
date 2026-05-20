import { applyDecorators, UseGuards } from '@nestjs/common';
import { ProfileCompletionGuard } from '../guards/profile-completion.guard';

/**
 * Gates a route behind a completed user profile. Stack on top of
 * `@Protected(Role.USER)` (or any auth decorator that resolves the
 * principal first); the guard short-circuits with 403 when the
 * user still needs to finish onboarding.
 */
export function RequireCompletedProfile() {
  return applyDecorators(UseGuards(ProfileCompletionGuard));
}
