import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { EnvironmentConfig } from 'infrastructure/config';
import { Translator } from 'infrastructure/i18n';
import { IWhatsAppNotifier, WHATSAPP_NOTIFIER } from 'infrastructure/whatsapp-client';
import { sha256 } from 'shared/utils';
import { OtpIssueResult } from '../dto/otp-issue-result.dto';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { OtpRepository } from '../repositories/otp.repository';

// Upper bound on the WhatsApp dispatch phase. The production notifier already
// delegates to WhatsappQueueService (non-blocking), so this limit only fires
// if a future notifier implementation blocks. On timeout, the code is still
// valid in the DB and the caller receives a dispatchWarning — same path as a
// connection failure.
const DISPATCH_TIMEOUT_MS = 5_000;

/**
 * OTP issue/verify infrastructure. Used by user auth.
 *
 * - issue(phone, purpose): generates a code, persists hash + TTL, dispatches
 *   via the WhatsApp notifier. Enforces a per-phone resend cooldown.
 *   If dispatch fails, the code is still valid and a dispatchWarning is returned
 *   so the caller can surface a "contact support" message to the user.
 * - verify(phone, purpose, code): consumes the most recent active code if
 *   it matches; increments attempts on mismatch. Caps verify attempts.
 *
 * OTP_FIXED_CODE forces the persisted code to a fixed value (development
 * convenience). Random generation still runs and is logged so the dev path
 * mirrors production.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  private readonly ttlSeconds: number;
  private readonly cooldownSeconds: number;
  private readonly maxVerifyAttempts: number;
  private readonly codeLength: number;
  private readonly phoneLockWindowSeconds: number;
  private readonly phoneMaxFailuresPerWindow: number;
  private readonly issueWindowSeconds: number;
  private readonly maxIssuesPerWindow: number;
  private readonly fixedCode?: string;

  constructor(
    private readonly otpRepo: OtpRepository,
    private readonly config: ConfigService<EnvironmentConfig>,
    private readonly translator: Translator,
    @Inject(WHATSAPP_NOTIFIER)
    private readonly whatsapp: IWhatsAppNotifier,
  ) {
    this.ttlSeconds = this.config.get<number>('OTP_TTL_SECONDS')!;
    this.cooldownSeconds = this.config.get<number>('OTP_RESEND_COOLDOWN_SECONDS')!;
    this.maxVerifyAttempts = this.config.get<number>('OTP_MAX_VERIFY_ATTEMPTS')!;
    this.codeLength = this.config.get<number>('OTP_CODE_LENGTH')!;
    this.phoneLockWindowSeconds = this.config.get<number>('OTP_PHONE_LOCK_WINDOW_SECONDS')!;
    this.phoneMaxFailuresPerWindow = this.config.get<number>(
      'OTP_PHONE_MAX_FAILURES_PER_WINDOW',
    );
    this.issueWindowSeconds = this.config.get<number>('OTP_ISSUE_WINDOW_SECONDS')!;
    this.maxIssuesPerWindow = this.config.get<number>('OTP_MAX_ISSUES_PER_WINDOW')!;
    this.fixedCode = this.config.get<string>('OTP_FIXED_CODE') || undefined;
  }

  async issue(phone: string, purpose: OtpPurpose): Promise<OtpIssueResult> {
    // Block code reissue when the phone is in rolling lockout — otherwise an
    // attacker who exhausted per-code attempts could keep reissuing fresh codes.
    await this.assertPhoneNotLocked(phone, purpose);
    await this.assertIssueRateNotExceeded(phone, purpose);

    const latest = await this.otpRepo.findLatestByPhoneAndPurpose(phone, purpose);
    if (latest && !latest.consumedAt) {
      const ageSeconds = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (ageSeconds < this.cooldownSeconds) {
        const remaining = Math.ceil(this.cooldownSeconds - ageSeconds);
        throw new BadRequestException(
          this.translator.tr('otp.errors.resend_cooldown', { seconds: remaining }),
        );
      }
    }

    await this.otpRepo.invalidateActive(phone, purpose);

    const generated = this.generateCode();
    const persisted = this.fixedCode ?? generated;
    const codeHash = sha256(persisted);
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    const otp = this.otpRepo.create({ phone, purpose, codeHash, expiresAt, attempts: 0 });
    await this.otpRepo.save(otp);

    let dispatchWarning: string | undefined;
    let timerId: NodeJS.Timeout | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error(`WhatsApp dispatch timed out after ${DISPATCH_TIMEOUT_MS}ms`)),
          DISPATCH_TIMEOUT_MS,
        );
      });
      await Promise.race([this.whatsapp.sendOtp(phone, persisted), timeout]);
    } catch (err) {
      this.logger.error(`WhatsApp dispatch failed for phone=${phone} purpose=${purpose}`, err);
      dispatchWarning = this.translator.tr('otp.warnings.dispatch_failed');
    } finally {
      clearTimeout(timerId);
    }

    return new OtpIssueResult(expiresAt, this.cooldownSeconds, dispatchWarning);
  }

  async verify(phone: string, purpose: OtpPurpose, code: string): Promise<void> {
    // Reject before exposing any per-code state when the phone is locked.
    await this.assertPhoneNotLocked(phone, purpose);

    const otp = await this.otpRepo.findActiveByPhoneAndPurpose(phone, purpose);
    if (!otp) {
      throw new UnauthorizedException(this.translator.tr('otp.errors.no_active_code'));
    }

    if (otp.attempts >= this.maxVerifyAttempts) {
      await this.otpRepo.markConsumed(otp.id, new Date());
      throw new UnauthorizedException(this.translator.tr('otp.errors.too_many_attempts'));
    }

    const incomingHash = sha256(code);
    if (!this.hashesEqual(incomingHash, otp.codeHash)) {
      await this.otpRepo.incrementAttempts(otp.id);
      throw new UnauthorizedException(this.translator.tr('otp.errors.invalid_code'));
    }

    await this.otpRepo.markConsumed(otp.id, new Date());
  }

  /**
   * Nightly housekeeping: drop OTP rows older than every rolling window this
   * service counts over, so the table stays bounded without resetting an
   * in-flight issue-rate or phone-lock count.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneStaleOtps(): Promise<void> {
    const retentionSeconds = Math.max(this.phoneLockWindowSeconds, this.issueWindowSeconds);
    const cutoff = new Date(Date.now() - retentionSeconds * 1000);
    await this.otpRepo.deleteCreatedBefore(cutoff);
  }

  private generateCode(): string {
    const max = 10 ** this.codeLength;
    const n = crypto.randomInt(0, max);
    return n.toString().padStart(this.codeLength, '0');
  }

  private hashesEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Enforces a rolling per-phone OTP request cap to prevent SMS flooding.
   * Counts all issue() calls (regardless of verification) within the window.
   */
  private async assertIssueRateNotExceeded(phone: string, purpose: OtpPurpose): Promise<void> {
    const since = new Date(Date.now() - this.issueWindowSeconds * 1000);
    const count = await this.otpRepo.countRequestsSince(phone, purpose, since);
    if (count >= this.maxIssuesPerWindow) {
      const minutes = Math.ceil(this.issueWindowSeconds / 60);
      throw new BadRequestException(
        this.translator.tr('otp.errors.issue_rate_exceeded', { minutes }),
      );
    }
  }

  /**
   * Enforces a rolling per-phone failure cap on top of the per-code cap.
   * Without this, an attacker who exhausts attempts on one code can simply
   * request another. Locks for the remainder of the rolling window.
   */
  private async assertPhoneNotLocked(phone: string, purpose: OtpPurpose): Promise<void> {
    const since = new Date(Date.now() - this.phoneLockWindowSeconds * 1000);
    const failed = await this.otpRepo.sumFailedAttemptsSince(phone, purpose, since);
    if (failed >= this.phoneMaxFailuresPerWindow) {
      const minutes = Math.ceil(this.phoneLockWindowSeconds / 60);
      throw new UnauthorizedException(
        this.translator.tr('otp.errors.phone_locked', { minutes }),
      );
    }
  }
}
