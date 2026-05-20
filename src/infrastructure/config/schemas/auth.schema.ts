import { z } from 'zod';

export const authSchema = z.object({
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(31),

  SEED_ADMIN_USERNAME: z.string().min(3),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_ADMIN_FIRST_NAME: z.string().min(1),
  SEED_ADMIN_LAST_NAME: z.string().min(1),
});

export type AuthConfig = z.infer<typeof authSchema>;
