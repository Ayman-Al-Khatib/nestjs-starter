import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvironmentConfig } from 'infrastructure/config';
import { FIREBASE_ADMIN } from '../../constants/notification.tokens';

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentConfig>): admin.app.App => {
    const serviceAccountRaw = configService.getOrThrow<string>(
      'NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT',
    );

    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch {
      throw new Error(
        'NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT must be a valid JSON string',
      );
    }

    return admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  },
};
