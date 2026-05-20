import { Global, Module } from '@nestjs/common';
import { NOTIFICATION_PROVIDER } from './constants/notification.tokens';
import { FirebaseAdminProvider } from './providers/firebase/firebase-admin.provider';
import { FirebaseNotificationProvider } from './providers/firebase/firebase-notification.provider';
import { PushNotificationService } from './push-notification.service';

@Global()
@Module({
  providers: [
    FirebaseAdminProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      useClass: FirebaseNotificationProvider,
    },
    PushNotificationService,
  ],
  exports: [PushNotificationService, NOTIFICATION_PROVIDER],
})
export class PushNotificationModule {}
