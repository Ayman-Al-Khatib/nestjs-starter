import { BadRequestException } from '@nestjs/common';
import { Translator } from 'infrastructure/i18n';
import {
  BaseNotificationOptions,
  BatchResponse,
  INotificationProvider,
  SingleTokenNotificationOptions,
  TokensNotificationOptions,
  TopicNotificationOptions,
} from '../interfaces';

export abstract class AbstractNotificationProvider implements INotificationProvider {
  constructor(protected readonly translator: Translator) {}

  abstract sendToToken(options: SingleTokenNotificationOptions): Promise<string>;
  abstract sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse>;
  abstract sendToTopic(options: TopicNotificationOptions): Promise<string>;
  abstract subscribeToTopic(tokens: string[], topic: string): Promise<void>;
  abstract unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;

  protected validateBaseOptions(options: BaseNotificationOptions): void {
    if (!options.title) {
      throw new BadRequestException(this.translator.tr('notification.errors.title_required'));
    }
    if (!options.body) {
      throw new BadRequestException(this.translator.tr('notification.errors.body_required'));
    }
  }

  protected validateSingleTokenOptions(options: SingleTokenNotificationOptions): void {
    this.validateBaseOptions(options);
    if (!options.token) {
      throw new BadRequestException(this.translator.tr('notification.errors.token_required'));
    }
  }

  protected validateTokensOptions(options: TokensNotificationOptions): void {
    this.validateBaseOptions(options);
    if (!Array.isArray(options.tokens) || options.tokens.length === 0) {
      throw new BadRequestException(this.translator.tr('notification.errors.tokens_required'));
    }
  }

  protected validateTopicOptions(options: TopicNotificationOptions): void {
    this.validateBaseOptions(options);
    if (!options.topic) {
      throw new BadRequestException(this.translator.tr('notification.errors.topic_required'));
    }
  }
}
