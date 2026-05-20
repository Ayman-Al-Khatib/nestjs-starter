import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerRequest } from '@nestjs/throttler/dist/throttler.guard.interface';

export const AUTH_THROTTLE_METADATA = 'app:throttle:auth';
export const UPLOAD_THROTTLE_METADATA = 'app:throttle:upload';

const DEFAULT_THROTTLER = 'default';
const AUTH_THROTTLER = 'auth';
const UPLOAD_THROTTLER = 'upload';

/**
 * Routes opt in to a stricter named throttler via `@AuthThrottle()` or
 * `@UploadThrottle()`. Limits live in `ThrottlerModule.forRootAsync` and
 * are pulled from ConfigService at boot.
 *
 * All three named throttlers are registered globally, so without this
 * override every route would also be subject to the strict auth/upload
 * budgets. handleRequest filters down to a single active throttler:
 *   - auth marker present  → only the `auth` throttler runs
 *   - upload marker present → only the `upload` throttler runs
 *   - otherwise            → only the `default` throttler runs
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(req: ThrottlerRequest): Promise<boolean> {
    if (req.throttler.name !== this.resolveActiveThrottler(req.context)) {
      return true;
    }
    return super.handleRequest(req);
  }

  private resolveActiveThrottler(context: ExecutionContext): string {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(AUTH_THROTTLE_METADATA, targets)) {
      return AUTH_THROTTLER;
    }
    if (this.reflector.getAllAndOverride<boolean>(UPLOAD_THROTTLE_METADATA, targets)) {
      return UPLOAD_THROTTLER;
    }
    return DEFAULT_THROTTLER;
  }
}
