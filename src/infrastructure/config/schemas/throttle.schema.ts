import { z } from 'zod';

export const throttleSchema = z.object({
  // Default sliding window (seconds) applied to every HTTP route.
  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  // Default request budget per IP within the window. Sensitive endpoints
  // (login / OTP / refresh) override this via `@AuthThrottle()`.
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  // Stricter limit for credential / OTP / refresh endpoints. Read by
  // @AuthThrottle() at decoration time (env loaded via bootstrap-env.ts).
  AUTH_THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),

  // Stricter limit for file upload endpoints (photos, attachments).
  // Read by @UploadThrottle() at decoration time.
  UPLOAD_THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  UPLOAD_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
});

export type ThrottleConfig = z.infer<typeof throttleSchema>;
