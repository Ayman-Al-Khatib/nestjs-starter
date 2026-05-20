import { INestApplication, RequestMethod, VersioningType } from '@nestjs/common';
import { LOCAL_STORAGE_ROUTE } from 'infrastructure/storage';

const API_PREFIX = 'api';
const HEALTH_PREFIX = 'healthz';

export function configureRouting(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX, {
    exclude: [
      '/',
      { path: `${LOCAL_STORAGE_ROUTE}/*path`, method: RequestMethod.GET },
      // Health probes (k8s / load balancers) are unversioned and live outside
      // /api so orchestrators don't need to know the API version.
      { path: HEALTH_PREFIX, method: RequestMethod.GET },
      { path: `${HEALTH_PREFIX}/ready`, method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({ type: VersioningType.URI });
}
