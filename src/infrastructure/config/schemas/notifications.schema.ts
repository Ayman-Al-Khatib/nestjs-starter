import { z } from 'zod';

export const notificationsSchema = z.object({
  NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT: z.string().min(1).optional(),
});

export type NotificationsConfig = z.infer<typeof notificationsSchema>;
