import { z } from 'zod';

export const whatsappSchema = z.object({
  WHATSAPP_DRIVER: z.enum(['baileys', 'stub']).default('stub'),

  // Random delay between consecutive sends is uniform in [min, max] ms — randomized
  // spacing avoids the bot-like cadence that triggers number bans.
  WHATSAPP_QUEUE_MIN_DELAY_MS: z.coerce.number().int().min(0).default(3000),
  WHATSAPP_QUEUE_MAX_DELAY_MS: z.coerce.number().int().min(0).default(8000),

  // Hard cap on pending queue depth — protects against unbounded memory growth.
  WHATSAPP_QUEUE_MAX_SIZE: z.coerce.number().int().positive().default(1000),
});

export type WhatsappConfig = z.infer<typeof whatsappSchema>;
