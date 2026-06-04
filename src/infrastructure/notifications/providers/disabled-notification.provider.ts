import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { BatchResponse, INotificationProvider } from '../interfaces';

/**
 * Null-object notifier bound when no Firebase service account is configured.
 * Lets the app boot without push credentials; any actual send rejects so a
 * missing configuration surfaces on first use rather than silently dropping
 * notifications. The message is intentionally not translated — push errors
 * are a third-party concern handled at the call site, never returned verbatim
 * to the client.
 */
@Injectable()
export class DisabledNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(DisabledNotificationProvider.name);

  constructor() {
    this.logger.warn(
      'Push notifications are disabled: NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT is unset or not valid JSON.',
    );
  }

  sendToToken(): Promise<string> {
    return this.disabled();
  }

  sendToTokens(): Promise<BatchResponse> {
    return this.disabled();
  }

  sendToTopic(): Promise<string> {
    return this.disabled();
  }

  subscribeToTopic(): Promise<void> {
    return this.disabled();
  }

  unsubscribeFromTopic(): Promise<void> {
    return this.disabled();
  }

  private disabled<T>(): Promise<T> {
    return Promise.reject<T>(
      new ServiceUnavailableException('Push notifications are not configured.'),
    );
  }
}
