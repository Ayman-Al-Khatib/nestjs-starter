import { AdminAuthService } from '../services/admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';

describe('AdminAuthController', () => {
  it('delegates login to the auth service', async () => {
    const adminAuthService = {
      login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    };
    const controller = new AdminAuthController(
      adminAuthService as unknown as AdminAuthService,
    );

    const result = await controller.login({ username: 'root', password: 'pw' });

    expect(adminAuthService.login).toHaveBeenCalledWith({ username: 'root', password: 'pw' });
    expect(result.accessToken).toBe('a');
  });
});
