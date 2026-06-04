import { Role } from 'domain/enums/role.enum';
import { AuthUserResolver } from './auth-user-resolver.interface';
import { UserResolverRegistry } from './user-resolver.registry';

const resolver = (): AuthUserResolver => ({ findByIdForAuth: jest.fn().mockResolvedValue(null) });

describe('UserResolverRegistry', () => {
  let registry: UserResolverRegistry;

  beforeEach(() => {
    registry = new UserResolverRegistry();
  });

  it('registers and retrieves a resolver by role', () => {
    const r = resolver();
    registry.register(Role.ADMIN, r);
    expect(registry.get(Role.ADMIN)).toBe(r);
  });

  it('returns undefined for an unregistered role', () => {
    expect(registry.get(Role.USER)).toBeUndefined();
  });

  it('throws on a duplicate registration for the same role', () => {
    registry.register(Role.ADMIN, resolver());
    expect(() => registry.register(Role.ADMIN, resolver())).toThrow(/already registered/);
  });
});
