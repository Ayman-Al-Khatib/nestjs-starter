import { z } from 'zod';
import { Environment } from '../env.constant';

export const otpSchema = z.object({
  OTP_TTL_SECONDS: z.coerce.number().int().positive(),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive(),
  OTP_MAX_VERIFY_ATTEMPTS: z.coerce.number().int().positive(),
  OTP_CODE_LENGTH: z.coerce.number().int().min(4).max(10),

  // Rolling window (seconds) for counting failed verify attempts per phone+purpose,
  // paired with OTP_PHONE_MAX_FAILURES_PER_WINDOW to block code-reissue bypass.
  OTP_PHONE_LOCK_WINDOW_SECONDS: z.coerce.number().int().positive(),
  OTP_PHONE_MAX_FAILURES_PER_WINDOW: z.coerce.number().int().positive(),

  // Rolling window (seconds) for counting OTP issue requests per phone+purpose,
  // paired with OTP_MAX_ISSUES_PER_WINDOW to prevent SMS flooding.
  OTP_ISSUE_WINDOW_SECONDS: z.coerce.number().int().positive(),
  OTP_MAX_ISSUES_PER_WINDOW: z.coerce.number().int().positive(),

  // If set, OtpService.issue() stores hash(this code) regardless of the generated
  // random code. Useful for development. Empty / unset = real codes.
  // Cross-validated by refineOtpConfig: forbidden when NODE_ENV=production so a
  // leaked dev env var can never silently make every issued OTP identical.
  OTP_FIXED_CODE: z.string().optional(),
});

export const refineOtpConfig = (
  value: { NODE_ENV: Environment; OTP_FIXED_CODE?: string },
  ctx: z.RefinementCtx,
): void => {
  if (value.NODE_ENV === Environment.PRODUCTION && value.OTP_FIXED_CODE) {
    ctx.addIssue({
      code: 'custom',
      path: ['OTP_FIXED_CODE'],
      message:
        'OTP_FIXED_CODE must not be set when NODE_ENV=production — a fixed OTP code in production would make every issued code identical and is a critical security flaw.',
    });
  }
};

export type OtpConfig = z.infer<typeof otpSchema>;
