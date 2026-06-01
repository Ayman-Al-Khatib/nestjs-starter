import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { ProfileCompletionGuard } from 'core/guards/profile-completion.guard';
import { UserResolverRegistry } from './user-resolver.registry';

/**
 * Hosts cross-cutting auth pieces that role modules and route guards
 * both need. Marked @Global so feature modules can inject
 * UserResolverRegistry without re-importing this module.
 *
 * JwtAuthGuard is registered as an APP_GUARD so authentication is
 * fail-closed: every route requires a valid token unless explicitly
 * marked @Public(). @Protected(...) only layers role metadata on top.
 */
@Global()
@Module({
  providers: [
    UserResolverRegistry,
    JwtAuthGuard,
    ProfileCompletionGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
  exports: [UserResolverRegistry, JwtAuthGuard, ProfileCompletionGuard],
})
export class CommonAuthModule {}
