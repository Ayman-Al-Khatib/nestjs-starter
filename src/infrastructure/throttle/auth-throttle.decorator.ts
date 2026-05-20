import { SetMetadata } from '@nestjs/common';
import { AUTH_THROTTLE_METADATA } from './app-throttler.guard';

/**
 * Stack on credential / OTP / refresh handlers. Activates the `auth`
 * named throttler — limits come from `AUTH_THROTTLE_LIMIT` /
 * `AUTH_THROTTLE_TTL_SECONDS` via ConfigService.
 */
export const AuthThrottle = (): MethodDecorator & ClassDecorator =>
  SetMetadata(AUTH_THROTTLE_METADATA, true);
