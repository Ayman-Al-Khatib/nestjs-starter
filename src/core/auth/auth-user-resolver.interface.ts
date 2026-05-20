import { BaseAccountEntity } from 'domain/entities/base-account.entity';

/**
 * Contract each role-owning module implements so the JwtAuthGuard can
 * load the principal without importing role-specific repositories.
 * The role's service implements this and self-registers with
 * UserResolverRegistry on module init.
 */
export interface AuthUserResolver<TEntity extends BaseAccountEntity = BaseAccountEntity> {
  /**
   * Implementations MUST return null when the user is missing — never
   * throw for "not found". Runtime errors may still propagate.
   */
  findByIdForAuth(id: number): Promise<TEntity | null>;
}
