import { UnauthorizedException } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { AdminEntity } from '../entities/admin.entity';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';

function admin(passwordMatches: boolean): AdminEntity {
  return {
    id: 5,
    username: 'root',
    checkPassword: jest.fn().mockResolvedValue(passwordMatches),
  } as unknown as AdminEntity;
}

describe('AdminAuthService', () => {
  let adminService: {
    findByUsername: jest.Mock;
    buildResponseDto: jest.Mock;
  };
  let jwtService: { createAccessToken: jest.Mock };
  let refreshTokenService: { issue: jest.Mock };
  let service: AdminAuthService;
  const translator = createTranslatorMock();

  beforeEach(() => {
    adminService = {
      findByUsername: jest.fn(),
      buildResponseDto: jest.fn().mockResolvedValue({ id: 5, username: 'root' }),
    };
    jwtService = { createAccessToken: jest.fn().mockReturnValue('access-token') };
    refreshTokenService = {
      issue: jest.fn().mockResolvedValue({ token: 'refresh-token', expiresAt: new Date() }),
    };
    service = new AdminAuthService(
      adminService as unknown as AdminService,
      jwtService as unknown as AppJwtService,
      refreshTokenService as unknown as RefreshTokenService,
      translator,
    );
  });

  it('issues access + refresh tokens on valid credentials', async () => {
    adminService.findByUsername.mockResolvedValue(admin(true));

    const result = await service.login({ username: 'root', password: 'pw' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(refreshTokenService.issue).toHaveBeenCalledWith(5, Role.ADMIN);
    expect(jwtService.createAccessToken).toHaveBeenCalledWith({ userId: 5, role: Role.ADMIN });
  });

  it('rejects an unknown username (and still issues no token)', async () => {
    adminService.findByUsername.mockResolvedValue(null);
    await expect(service.login({ username: 'ghost', password: 'pw' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshTokenService.issue).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    adminService.findByUsername.mockResolvedValue(admin(false));
    await expect(service.login({ username: 'root', password: 'bad' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshTokenService.issue).not.toHaveBeenCalled();
  });
});
