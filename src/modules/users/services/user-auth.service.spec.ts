import { Role } from 'domain/enums/role.enum';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { OtpPurpose } from 'modules/otps/enums/otp-purpose.enum';
import { OtpService } from 'modules/otps/services/otp.service';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { UserEntity } from '../entities/user.entity';
import { UserService } from './user.service';
import { UserAuthService } from './user-auth.service';

describe('UserAuthService', () => {
  let userService: {
    findOneOrCreateByPhone: jest.Mock;
    buildResponseDto: jest.Mock;
  };
  let otpService: { issue: jest.Mock; verify: jest.Mock };
  let jwtService: { createAccessToken: jest.Mock };
  let refreshTokenService: { issue: jest.Mock };
  let service: UserAuthService;

  beforeEach(() => {
    userService = {
      findOneOrCreateByPhone: jest
        .fn()
        .mockResolvedValue({ id: 9, isProfileCompleted: false } as UserEntity),
      buildResponseDto: jest.fn().mockResolvedValue({ id: 9 }),
    };
    otpService = { issue: jest.fn(), verify: jest.fn().mockResolvedValue(undefined) };
    jwtService = { createAccessToken: jest.fn().mockReturnValue('access') };
    refreshTokenService = {
      issue: jest.fn().mockResolvedValue({ token: 'refresh', expiresAt: new Date() }),
    };

    service = new UserAuthService(
      userService as unknown as UserService,
      otpService as unknown as OtpService,
      jwtService as unknown as AppJwtService,
      refreshTokenService as unknown as RefreshTokenService,
    );
  });

  it('delegates OTP request to the OtpService with the USER_LOGIN purpose', () => {
    service.requestOtp('+963944123456');
    expect(otpService.issue).toHaveBeenCalledWith('+963944123456', OtpPurpose.USER_LOGIN);
  });

  describe('verifyOtp', () => {
    it('verifies the OTP, provisions the user, and issues tokens', async () => {
      const result = await service.verifyOtp('+963944123456', '123456');

      expect(otpService.verify).toHaveBeenCalledWith(
        '+963944123456',
        OtpPurpose.USER_LOGIN,
        '123456',
      );
      expect(userService.findOneOrCreateByPhone).toHaveBeenCalledWith('+963944123456');
      expect(jwtService.createAccessToken).toHaveBeenCalledWith({ userId: 9, role: Role.USER });
      expect(refreshTokenService.issue).toHaveBeenCalledWith(9, Role.USER);
      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
    });

    it('does not issue tokens when OTP verification fails', async () => {
      otpService.verify.mockRejectedValue(new Error('invalid code'));
      await expect(service.verifyOtp('+963944123456', '000000')).rejects.toThrow();
      expect(refreshTokenService.issue).not.toHaveBeenCalled();
    });
  });
});
