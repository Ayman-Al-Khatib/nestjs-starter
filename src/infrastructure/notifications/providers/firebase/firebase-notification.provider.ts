import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Translator } from 'infrastructure/i18n';
import { FIREBASE_ADMIN } from '../../constants/notification.tokens';
import {
  BaseNotificationOptions,
  BatchResponse,
  NotificationFailure,
  SingleTokenNotificationOptions,
  TokensNotificationOptions,
  TopicNotificationOptions,
} from '../../interfaces';
import { AbstractNotificationProvider } from '../abstract-notification.provider';

const MULTICAST_BATCH_SIZE = 500;

type FirebaseMessagePayload = Pick<
  admin.messaging.Message,
  'notification' | 'data' | 'android' | 'apns'
>;

@Injectable()
export class FirebaseNotificationProvider extends AbstractNotificationProvider {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App,
    translator: Translator,
  ) {
    super(translator);
  }

  async sendToToken(options: SingleTokenNotificationOptions): Promise<string> {
    this.validateSingleTokenOptions(options);
    return this.firebaseAdmin.messaging().send({
      token: options.token,
      ...this.buildPayload(options),
    });
  }

  async sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse> {
    this.validateTokensOptions(options);
    const { tokens, ...notification } = options;
    const batches = this.chunk(tokens, MULTICAST_BATCH_SIZE);
    const payload = this.buildPayload(notification);

    let successCount = 0;
    let failureCount = 0;
    const failures: NotificationFailure[] = [];

    await Promise.all(
      batches.map(async (batch, batchIndex) => {
        const response = await this.firebaseAdmin
          .messaging()
          .sendEachForMulticast({ tokens: batch, ...payload });

        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((resp, index) => {
          if (!resp.success && resp.error) {
            failures.push({
              index: batchIndex * MULTICAST_BATCH_SIZE + index,
              error: this.toError(resp.error),
            });
          }
        });
      }),
    );

    return { successCount, failureCount, failures };
  }

  async sendToTopic(options: TopicNotificationOptions): Promise<string> {
    this.validateTopicOptions(options);
    return this.firebaseAdmin.messaging().send({
      topic: options.topic,
      ...this.buildPayload(options),
    });
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    await this.firebaseAdmin.messaging().subscribeToTopic(tokens, topic);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    await this.firebaseAdmin.messaging().unsubscribeFromTopic(tokens, topic);
  }

  private buildPayload(options: BaseNotificationOptions): FirebaseMessagePayload {
    const sound = options.sound ?? 'default';
    return {
      notification: { title: options.title, body: options.body },
      data: options.data,
      android: {
        ttl: options.ttlInSeconds ? options.ttlInSeconds * 1000 : undefined,
        priority: options.priority ?? 'normal',
        notification: { sound, clickAction: options.clickAction },
      },
      apns: {
        payload: { aps: { sound } },
      },
    };
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  private toError(source: { code: string; message: string }): Error {
    const error = new Error(source.message);
    error.name = source.code;
    return error;
  }
}
