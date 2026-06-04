import { createTranslatorMock } from 'test-utils/test-helpers';
import { UserAuthService } from '../services/user-auth.service';
import { UserAuthController } from './user-auth.controller';

describe('UserAuthController', () => {
  let userAuthService: { requestOtp: jest.Mock; verifyOtp: jest.Mock };
  let controller: UserAuthController;
  const translator = createTranslatorMock();

  beforeEach(() => {
    userAuthService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    };
    controller = new UserAuthController(userAuthService as unknown as UserAuthService, translator);
  });

  it('returns expiry + cooldown when requesting an OTP', async () => {
    const expiresAt = new Date();
    userAuthService.requestOtp.mockResolvedValue({ expiresAt, cooldownSeconds: 60 });

    const result = await controller.requestOtp({ phone: '+963944123456' });

    expect(userAuthService.requestOtp).toHaveBeenCalledWith('+963944123456');
    expect(result).toMatchObject({ expiresAt, cooldownSeconds: 60 });
    expect(result.warning).toBeUndefined();
  });

  it('surfaces a dispatch warning when present', async () => {
    userAuthService.requestOtp.mockResolvedValue({
      expiresAt: new Date(),
      cooldownSeconds: 60,
      dispatchWarning: 'delivery failed',
    });
    const result = await controller.requestOtp({ phone: '+963944123456' });
    expect(result.warning).toBe('delivery failed');
  });

  it('delegates OTP verification to the service', async () => {
    await controller.verifyOtp({ phone: '+963944123456', code: '123456' });
    expect(userAuthService.verifyOtp).toHaveBeenCalledWith('+963944123456', '123456');
  });
});
