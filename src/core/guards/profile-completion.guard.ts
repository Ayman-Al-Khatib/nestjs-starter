import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import { Role } from 'domain/enums/role.enum';
import { Translator } from 'infrastructure/i18n';

interface AuthenticatedUser {
  isProfileCompleted?: boolean;
}

/**
 * Blocks USER requests whose profile is not yet completed. All other
 * roles bypass this guard. Must run AFTER JwtAuthGuard so that
 * `request.user` is already populated — the @RequireCompletedProfile()
 * decorator handles registration order.
 */
@Injectable()
export class ProfileCompletionGuard implements CanActivate {
  constructor(private readonly translator: Translator) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.user?.role !== Role.USER) {
      return true;
    }

    const user = request.user as AuthenticatedUser;
    if (user.isProfileCompleted !== true) {
      throw new ForbiddenException(
        this.translator.tr('user.errors.profile_not_completed'),
      );
    }

    return true;
  }
}
