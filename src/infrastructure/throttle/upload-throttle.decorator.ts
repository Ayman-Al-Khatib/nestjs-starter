import { SetMetadata } from '@nestjs/common';
import { UPLOAD_THROTTLE_METADATA } from './app-throttler.guard';

/**
 * Stack on file upload handlers. Activates the `upload` named throttler
 * — limits come from `UPLOAD_THROTTLE_LIMIT` / `UPLOAD_THROTTLE_TTL_SECONDS`
 * via ConfigService.
 */
export const UploadThrottle = (): MethodDecorator & ClassDecorator =>
  SetMetadata(UPLOAD_THROTTLE_METADATA, true);
