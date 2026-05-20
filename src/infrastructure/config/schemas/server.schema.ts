import { z } from 'zod';
import { Environment } from '../env.constant';

export const serverSchema = z.object({
  NODE_ENV: z.nativeEnum(Environment),

  APP_PORT: z.coerce.number().int().positive(),
});

export type ServerConfig = z.infer<typeof serverSchema>;
