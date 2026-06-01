import { UnauthorizedException } from '@nestjs/common';
import { sha256 } from 'shared/utils';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { OtpService } from './otp.service';

/**
 * Focused coverage of the verify() gate: lock checks, attempt cap, and
 * constant-time code comparison outcomes.
 */
describe('OtpService.verify', () => {
  const CONFIG: Record<string, number | undefined> = {
    OTP_TTL_SECONDS: 300,
    OTP_RESEND_COOLDOWN_SECONDS: 60,
    OTP_MAX_VERIFY_ATTEMPTS: 5,
    OTP_CODE_LENGTH: 6,
    OTP_PHONE_LOCK_WINDOW_SECONDS: 14_400,
    OTP_PHONE_MAX_FAILURES_PER_WINDOW: 30,
    OTP_ISSUE_WINDOW_SECONDS: 3_600,
    OTP_MAX_ISSUES_PER_WINDOW: 3,
    OTP_FIXED_CODE: undefined,
  };

  let otpRepo: {
    sumFailedAttemptsSince: jest.Mock;
    findActiveByPhoneAndPurpose: jest.Mock;
    markConsumed: jest.Mock;
    incrementAttempts: jest.Mock;
  };
  let service: OtpService;

  const phone = '+963944123456';

  beforeEach(() => {
    otpRepo = {
      sumFailedAttemptsSince: jest.fn().mockResolvedValue(0),
      findActiveByPhoneAndPurpose: jest.fn(),
      markConsumed: jest.fn().mockResolvedValue(undefined),
      incrementAttempts: jest.fn().mockResolvedValue(undefined),
    };
    const config = { get: jest.fn((key: string) => CONFIG[key]) };
    const translator = { tr: jest.fn().mockReturnValue('msg') };
    const whatsapp = { sendOtp: jest.fn() };

    service = new OtpService(
      otpRepo as never,
      config as never,
      translator as never,
      whatsapp as never,
    );
  });

  it('rejects when there is no active code', async () => {
    otpRepo.findActiveByPhoneAndPurpose.mockResolvedValue(null);

    await expect(service.verify(phone, OtpPurpose.USER_LOGIN, '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('consumes the code and burns the attempt budget when attempts are exhausted', async () => {
    otpRepo.findActiveByPhoneAndPurpose.mockResolvedValue({
      id: '1',
      attempts: 5,
      codeHash: sha256('123456'),
    });

    await expect(service.verify(phone, OtpPurpose.USER_LOGIN, '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(otpRepo.markConsumed).toHaveBeenCalledWith('1', expect.any(Date));
  });

  it('increments attempts and rejects on a wrong code', async () => {
    otpRepo.findActiveByPhoneAndPurpose.mockResolvedValue({
      id: '1',
      attempts: 0,
      codeHash: sha256('111111'),
    });

    await expect(service.verify(phone, OtpPurpose.USER_LOGIN, '222222')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(otpRepo.incrementAttempts).toHaveBeenCalledWith('1');
    expect(otpRepo.markConsumed).not.toHaveBeenCalled();
  });

  it('consumes the code on a correct match', async () => {
    otpRepo.findActiveByPhoneAndPurpose.mockResolvedValue({
      id: '1',
      attempts: 0,
      codeHash: sha256('123456'),
    });

    await expect(service.verify(phone, OtpPurpose.USER_LOGIN, '123456')).resolves.toBeUndefined();
    expect(otpRepo.markConsumed).toHaveBeenCalledWith('1', expect.any(Date));
  });

  it('locks out the phone once the rolling failure cap is hit', async () => {
    otpRepo.sumFailedAttemptsSince.mockResolvedValue(30);

    await expect(service.verify(phone, OtpPurpose.USER_LOGIN, '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(otpRepo.findActiveByPhoneAndPurpose).not.toHaveBeenCalled();
  });
});
