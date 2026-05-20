import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { ProfileCompletionGuard } from 'core/guards/profile-completion.guard';
import { UserResolverRegistry } from './user-resolver.registry';

/**
 * Hosts cross-cutting auth pieces that role modules and route guards
 * both need. Marked @Global so feature modules can inject
 * UserResolverRegistry without re-importing this module.
 */
@Global()
@Module({
  providers: [UserResolverRegistry, JwtAuthGuard, ProfileCompletionGuard],
  exports: [UserResolverRegistry, JwtAuthGuard, ProfileCompletionGuard],
})
export class CommonAuthModule {}
