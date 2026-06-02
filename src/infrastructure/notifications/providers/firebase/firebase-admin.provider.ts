import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvironmentConfig } from 'infrastructure/config';
import { FIREBASE_ADMIN } from '../../constants/notification.tokens';

/**
 * Resolves the Firebase Admin app, or null when no service account is
 * configured. Returning null (not throwing) keeps the app booting without
 * push credentials — the module binds the disabled notifier instead. Push
 * activates only once a valid service-account JSON is supplied, so the
 * starter boots in every environment whether or not Firebase is set up.
 */
export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentConfig>): admin.app.App | null => {
    const serviceAccount = parseServiceAccount(
      configService.get<string>('NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT'),
    );
    if (!serviceAccount) {
      return null;
    }

    return admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  },
};

function parseServiceAccount(raw: string | undefined): admin.ServiceAccount | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    return null;
  }
}
