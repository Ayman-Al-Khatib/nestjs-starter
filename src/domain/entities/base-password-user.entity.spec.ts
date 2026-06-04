import { isPasswordHashed } from 'shared/utils';
import { Role } from 'domain/enums/role.enum';
import { BasePasswordUserEntity } from './base-password-user.entity';

class TestUser extends BasePasswordUserEntity {
  get role(): Role {
    return Role.ADMIN;
  }
}

describe('BasePasswordUserEntity', () => {
  it('hashes a plaintext password on save and stamps passwordChangedAt', async () => {
    const user = new TestUser();
    user.password = 'plaintext-secret';
    await user.hashPasswordOnSave();

    expect(isPasswordHashed(user.password)).toBe(true);
    expect(user.passwordChangedAt).toBeInstanceOf(Date);
  });

  it('does not re-hash an already-hashed password', async () => {
    const user = new TestUser();
    user.password = 'first';
    await user.hashPasswordOnSave();
    const firstHash = user.password;

    await user.hashPasswordOnSave();
    expect(user.password).toBe(firstHash);
  });

  it('is a no-op when no password is set', async () => {
    const user = new TestUser();
    user.password = '';
    await user.hashPasswordOnSave();
    expect(user.password).toBe('');
    expect(user.passwordChangedAt).toBeUndefined();
  });

  it('checkPassword verifies the plaintext against the stored hash', async () => {
    const user = new TestUser();
    user.password = 'correct-horse';
    await user.hashPasswordOnSave();

    await expect(user.checkPassword('correct-horse')).resolves.toBe(true);
    await expect(user.checkPassword('wrong')).resolves.toBe(false);
  });
});
