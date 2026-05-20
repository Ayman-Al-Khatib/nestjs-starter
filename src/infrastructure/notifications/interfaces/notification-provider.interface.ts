import { BatchResponse } from './batch-response.interface';
import { SingleTokenNotificationOptions } from './single-token-notification-options.interface';
import { TokensNotificationOptions } from './tokens-notification-options.interface';
import { TopicNotificationOptions } from './topic-notification-options.interface';

export interface INotificationProvider {
  sendToToken(options: SingleTokenNotificationOptions): Promise<string>;
  sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse>;
  sendToTopic(options: TopicNotificationOptions): Promise<string>;
  subscribeToTopic(tokens: string[], topic: string): Promise<void>;
  unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;
}
