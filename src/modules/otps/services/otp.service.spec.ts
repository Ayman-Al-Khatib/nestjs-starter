import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsAppNotifier } from 'infrastructure/whatsapp-client';
import { sha256 } from 'shared/utils';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { OtpRepository } from '../repositories/otp.repository';
import { OtpService } from './otp.service';

const PHONE = '+963944123456';

const CONFIG: Record<string, number | string> = {
  OTP_TTL_SECONDS: 300,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  OTP_MAX_VERIFY_ATTEMPTS: 5,
  OTP_CODE_LENGTH: 6,
  OTP_PHONE_LOCK_WINDOW_SECONDS: 900,
  OTP_PHONE_MAX_FAILURES_PER_WINDOW: 10,
  OTP_ISSUE_WINDOW_SECONDS: 600,
  OTP_MAX_ISSUES_PER_WINDOW: 5,
};

type OtpRow = {
  id: number;
  phone: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
};

function buildService(configOverrides: Record<string, number | string | undefined> = {}) {
  const merged = { ...CONFIG, ...configOverrides };
  const repo = {
    findLatestByPhoneAndPurpose: jest.fn().mockResolvedValue(null),
    findActiveByPhoneAndPurpose: jest.fn().mockResolvedValue(null),
    invalidateActive: jest.fn().mockResolvedValue(undefined),
    create: jest.fn((data) => data),
    save: jest.fn((row) => Promise.resolve(row)),
    markConsumed: jest.fn().mockResolvedValue(undefined),
    incrementAttempts: jest.fn().mockResolvedValue(undefined),
    countRequestsSince: jest.fn().mockResolvedValue(0),
    sumFailedAttemptsSince: jest.fn().mockResolvedValue(0),
    deleteCreatedBefore: jest.fn().mockResolvedValue(0),
  };
  const whatsapp = {
    sendOtp: jest.fn().mockResolvedValue({ messageId: 'm1', dispatchedAt: new Date() }),
  };
  const config = {
    get: jest.fn((key: string) => merged[key]),
  } as unknown as ConfigService;
  const translator = createTranslatorMock();

  const service = new OtpService(
    repo as unknown as OtpRepository,
    config,
    translator,
    whatsapp as unknown as IWhatsAppNotifier,
  );
  return { service, repo, whatsapp, translator };
}

describe('OtpService', () => {
  describe('issue', () => {
    it('persists the SHA-256 of the generated code and dispatches it via WhatsApp', async () => {
      const { service, repo, whatsapp } = buildService();

      const result = await service.issue(PHONE, OtpPurpose.USER_LOGIN);

      const dispatchedCode = whatsapp.sendOtp.mock.calls[0][1] as string;
      expect(dispatchedCode).toMatch(/^\d{6}$/);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: PHONE, codeHash: sha256(dispatchedCode), attempts: 0 }),
      );
      expect(repo.invalidateActive).toHaveBeenCalledWith(PHONE, OtpPurpose.USER_LOGIN);
      expect(result.dispatchWarning).toBeUndefined();
      expect(result.cooldownSeconds).toBe(60);
    });

    it('uses OTP_FIXED_CODE for the persisted/dispatched code when configured', async () => {
      const { service, repo, whatsapp } = buildService({ OTP_FIXED_CODE: '123456' });
      await service.issue(PHONE, OtpPurpose.USER_LOGIN);
      expect(whatsapp.sendOtp).toHaveBeenCalledWith(PHONE, '123456');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ codeHash: sha256('123456') }),
      );
    });

    it('enforces the resend cooldown when an unconsumed code is still fresh', async () => {
      const { service, repo } = buildService();
      repo.findLatestByPhoneAndPurpose.mockResolvedValue({
        consumedAt: null,
        createdAt: new Date(Date.now() - 10_000),
      });
      await expect(service.issue(PHONE, OtpPurpose.USER_LOGIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows reissue once the cooldown has elapsed', async () => {
      const { service, repo, whatsapp } = buildService();
      repo.findLatestByPhoneAndPurpose.mockResolvedValue({
        consumedAt: null,
        createdAt: new Date(Date.now() - 120_000),
      });
      await service.issue(PHONE, OtpPurpose.USER_LOGIN);
      expect(whatsapp.sendOtp).toHaveBeenCalled();
    });

    it('blocks issuing while the phone is in rolling lockout', async () => {
      const { service, repo, whatsapp } = buildService();
      repo.sumFailedAttemptsSince.mockResolvedValue(10);
      await expect(service.issue(PHONE, OtpPurpose.USER_LOGIN)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(whatsapp.sendOtp).not.toHaveBeenCalled();
    });

    it('blocks issuing when the per-window issue cap is reached', async () => {
      const { service, repo } = buildService();
      repo.countRequestsSince.mockResolvedValue(5);
      await expect(service.issue(PHONE, OtpPurpose.USER_LOGIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('keeps the code valid and returns a dispatchWarning when WhatsApp fails', async () => {
      const { service, repo, whatsapp } = buildService();
      whatsapp.sendOtp.mockRejectedValue(new Error('connection down'));

      const result = await service.issue(PHONE, OtpPurpose.USER_LOGIN);

      expect(repo.save).toHaveBeenCalled();
      expect(result.dispatchWarning).toBe('otp.warnings.dispatch_failed');
    });
  });

  describe('verify', () => {
    function activeOtp(over: Partial<OtpRow> = {}): OtpRow {
      return {
        id: 1,
        phone: PHONE,
        purpose: OtpPurpose.USER_LOGIN,
        codeHash: sha256('654321'),
        attempts: 0,
        consumedAt: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300_000),
        ...over,
      };
    }

    it('consumes the active code on a correct match', async () => {
      const { service, repo } = buildService();
      repo.findActiveByPhoneAndPurpose.mockResolvedValue(activeOtp());
      await service.verify(PHONE, OtpPurpose.USER_LOGIN, '654321');
      expect(repo.markConsumed).toHaveBeenCalledWith(1, expect.any(Date));
    });

    it('rejects when no active code exists', async () => {
      const { service } = buildService();
      await expect(
        service.verify(PHONE, OtpPurpose.USER_LOGIN, '654321'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('increments attempts and rejects on a wrong code', async () => {
      const { service, repo } = buildService();
      repo.findActiveByPhoneAndPurpose.mockResolvedValue(activeOtp());
      await expect(
        service.verify(PHONE, OtpPurpose.USER_LOGIN, '000000'),
      ).rejects.toThrow(UnauthorizedException);
      expect(repo.incrementAttempts).toHaveBeenCalledWith(1);
      expect(repo.markConsumed).not.toHaveBeenCalled();
    });

    it('consumes and rejects when the per-code attempt cap is exhausted', async () => {
      const { service, repo } = buildService();
      repo.findActiveByPhoneAndPurpose.mockResolvedValue(activeOtp({ attempts: 5 }));
      await expect(
        service.verify(PHONE, OtpPurpose.USER_LOGIN, '654321'),
      ).rejects.toThrow(UnauthorizedException);
      expect(repo.markConsumed).toHaveBeenCalledWith(1, expect.any(Date));
    });

    it('rejects up-front when the phone is locked', async () => {
      const { service, repo } = buildService();
      repo.sumFailedAttemptsSince.mockResolvedValue(10);
      await expect(
        service.verify(PHONE, OtpPurpose.USER_LOGIN, '654321'),
      ).rejects.toThrow(UnauthorizedException);
      expect(repo.findActiveByPhoneAndPurpose).not.toHaveBeenCalled();
    });
  });

  describe('pruneStaleOtps', () => {
    it('deletes rows older than the widest rolling window', async () => {
      const { service, repo } = buildService();
      await service.pruneStaleOtps();
      expect(repo.deleteCreatedBefore).toHaveBeenCalledWith(expect.any(Date));
    });
  });
});
