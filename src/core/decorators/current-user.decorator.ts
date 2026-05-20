import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BaseAccountEntity } from 'domain/entities/base-account.entity';

/**
 * Pulls the authenticated principal off the request, attached by JwtAuthGuard.
 * Type defaults to BaseAccountEntity; pass a concrete type at usage site for
 * stronger typing, e.g. @CurrentUser() admin: AdminEntity.
 */
export const CurrentUser = createParamDecorator(
  <T extends BaseAccountEntity = BaseAccountEntity>(_: unknown, ctx: ExecutionContext): T => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as T;
  },
);
