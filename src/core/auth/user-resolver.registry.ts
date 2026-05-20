import { Injectable } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';
import { AuthUserResolver } from './auth-user-resolver.interface';

/**
 * Process-wide registry mapping each Role to its AuthUserResolver.
 * Role-owning modules register their service in onModuleInit; the
 * JwtAuthGuard reads from here so it never imports a role's repository
 * or module directly — one guard serves all roles without cross-module
 * coupling.
 */
@Injectable()
export class UserResolverRegistry {
  private readonly resolvers = new Map<Role, AuthUserResolver>();

  register(role: Role, resolver: AuthUserResolver): void {
    if (this.resolvers.has(role)) {
      throw new Error(`Auth resolver already registered for role=${role}`);
    }
    this.resolvers.set(role, resolver);
  }

  get(role: Role): AuthUserResolver | undefined {
    return this.resolvers.get(role);
  }
}
