import { Global, Module, Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN, NOTIFICATION_PROVIDER } from './constants/notification.tokens';
import { DisabledNotificationProvider } from './providers/disabled-notification.provider';
import { FirebaseAdminProvider } from './providers/firebase/firebase-admin.provider';
import { FirebaseNotificationProvider } from './providers/firebase/firebase-notification.provider';
import { PushNotificationService } from './push-notification.service';

@Global()
@Module({
  providers: [
    FirebaseAdminProvider,
    FirebaseNotificationProvider,
    DisabledNotificationProvider,
    buildNotificationProvider(),
    PushNotificationService,
  ],
  exports: [PushNotificationService, NOTIFICATION_PROVIDER],
})
export class PushNotificationModule {}

function buildNotificationProvider(): Provider {
  return {
    provide: NOTIFICATION_PROVIDER,
    useFactory: (
      firebaseAdmin: admin.app.App | null,
      firebase: FirebaseNotificationProvider,
      disabled: DisabledNotificationProvider,
    ) => (firebaseAdmin ? firebase : disabled),
    inject: [FIREBASE_ADMIN, FirebaseNotificationProvider, DisabledNotificationProvider],
  };
}
