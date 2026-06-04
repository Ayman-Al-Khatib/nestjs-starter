import { z } from 'zod';
import {
  authSchema,
  cacheSchema,
  databaseSchema,
  jwtSchema,
  notificationsSchema,
  otpSchema,
  refineCacheConfig,
  refineOtpConfig,
  refineSecurityConfig,
  refineStorageConfig,
  securitySchema,
  serverSchema,
  storageSchema,
  throttleSchema,
  whatsappSchema,
} from './schemas';

export const environmentSchema = z
  .object({
    ...serverSchema.shape,
    ...securitySchema.shape,
    ...throttleSchema.shape,
    ...databaseSchema.shape,
    ...jwtSchema.shape,
    ...authSchema.shape,
    ...otpSchema.shape,
    ...cacheSchema.shape,
    ...storageSchema.shape,
    ...notificationsSchema.shape,
    ...whatsappSchema.shape,
  })
  .superRefine(refineStorageConfig)
  .superRefine(refineOtpConfig)
  .superRefine(refineSecurityConfig)
  .superRefine(refineCacheConfig);

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
