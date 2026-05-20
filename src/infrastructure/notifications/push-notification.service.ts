import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_PROVIDER } from './constants/notification.tokens';
import {
  BatchResponse,
  INotificationProvider,
  SingleTokenNotificationOptions,
  TokensNotificationOptions,
  TopicNotificationOptions,
} from './interfaces';

@Injectable()
export class PushNotificationService {
  constructor(
    @Inject(NOTIFICATION_PROVIDER) private readonly provider: INotificationProvider,
  ) {}

  sendToToken(options: SingleTokenNotificationOptions): Promise<string> {
    return this.provider.sendToToken(options);
  }

  sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse> {
    return this.provider.sendToTokens(options);
  }

  sendToTopic(options: TopicNotificationOptions): Promise<string> {
    return this.provider.sendToTopic(options);
  }

  subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    return this.provider.subscribeToTopic(tokens, topic);
  }

  unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    return this.provider.unsubscribeFromTopic(tokens, topic);
  }
}
