export interface BaseNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, string>;
  ttlInSeconds?: number;
  priority?: 'high' | 'normal';
  sound?: string;
  clickAction?: string;
}
