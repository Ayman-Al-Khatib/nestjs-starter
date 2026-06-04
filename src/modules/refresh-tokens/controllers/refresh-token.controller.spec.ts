import { Role } from 'domain/enums/role.enum';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { RefreshTokenService } from '../services/refresh-token.service';
import { RefreshTokenController } from './refresh-token.controller';

describe('RefreshTokenController', () => {
  let refreshTokenService: { rotate: jest.Mock; revoke: jest.Mock };
  let jwtService: { createAccessToken: jest.Mock };
  let controller: RefreshTokenController;
  const translator = createTranslatorMock();

  beforeEach(() => {
    refreshTokenService = {
      rotate: jest.fn().mockResolvedValue({
        token: 'new-refresh',
        userId: 1,
        role: Role.USER,
        expiresAt: new Date(),
      }),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = { createAccessToken: jest.fn().mockReturnValue('new-access') };
    controller = new RefreshTokenController(
      refreshTokenService as unknown as RefreshTokenService,
      jwtService as unknown as AppJwtService,
      translator,
    );
  });

  it('rotates the refresh token and mints a fresh access token', async () => {
    const result = await controller.refresh({ refreshToken: 'old' });
    expect(refreshTokenService.rotate).toHaveBeenCalledWith('old');
    expect(jwtService.createAccessToken).toHaveBeenCalledWith({ userId: 1, role: Role.USER });
    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
  });

  it('revokes the presented session on logout', async () => {
    const result = await controller.logout({ refreshToken: 'old' });
    expect(refreshTokenService.revoke).toHaveBeenCalledWith('old');
    expect(result.message).toBe('auth.messages.logout_success');
  });
});
