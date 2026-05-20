import { BaseNotificationOptions } from './base-notification-options.interface';

export interface TokensNotificationOptions extends BaseNotificationOptions {
  tokens: string[];
}
