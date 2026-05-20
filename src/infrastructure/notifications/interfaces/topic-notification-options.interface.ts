import { BaseNotificationOptions } from './base-notification-options.interface';

export interface TopicNotificationOptions extends BaseNotificationOptions {
  topic: string;
}
