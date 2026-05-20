import { BaseNotificationOptions } from './base-notification-options.interface';

export interface SingleTokenNotificationOptions extends BaseNotificationOptions {
  token: string;
}
