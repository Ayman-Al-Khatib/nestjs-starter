import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { EnvironmentConfig } from 'infrastructure/config';
import {
  DEFAULT_COMPRESSION_POLICY,
  DEFAULT_SIGNED_URL_TTL_SECONDS,
  DEFAULT_VALIDATION_POLICY,
} from './config/defaults';
import { ResolvedStorageConfig, StorageModuleOptions } from './config/storage-config';
import {
  STORAGE_CONFIG,
  STORAGE_IMAGE_PROCESSOR,
  STORAGE_PROVIDER,
  STORAGE_VALIDATORS,
} from './config/storage-tokens';
import { StorageDriver } from './core/enums/storage-driver.enum';
import { SharpImageProcessor } from './processing/sharp.image-processor';
import { LocalSigningService } from './providers/local/local-signing.service';
import { LocalStorageController } from './providers/local/local-storage.controller';
import { LocalStreamGuard } from './providers/local/local-stream.guard';
import { LocalStorageProvider } from './providers/local/local.provider';
import {
  LOCAL_STORAGE_BASE_PATH,
  LOCAL_STORAGE_PUBLIC_BASE_URL,
  LOCAL_STORAGE_SIGNING_SECRET,
} from './providers/local/local.tokens';
import { SupabaseStorageProvider } from './providers/supabase/supabase.provider';
import {
  SUPABASE_CLIENT,
  SUPABASE_PRIVATE_BUCKET,
  SUPABASE_PUBLIC_BUCKET,
} from './providers/supabase/supabase.tokens';
import { StorageService } from './service/storage.service';
import { FileValidationService } from './validation/file-validation.service';
import { DimensionsValidator } from './validation/validators/dimensions.validator';
import { FilenameValidator } from './validation/validators/filename.validator';
import { MimeTypeValidator } from './validation/validators/mime-type.validator';
import { SizeValidator } from './validation/validators/size.validator';

@Module({})
export class StorageModule {
  static forRoot(options: StorageModuleOptions = {}): DynamicModule {
    const configProvider: Provider = {
      provide: STORAGE_CONFIG,
      useValue: <ResolvedStorageConfig>{
        signedUrlTtlSeconds: options.signedUrlTtlSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS,
        defaultValidation: { ...DEFAULT_VALIDATION_POLICY, ...(options.defaultValidation ?? {}) },
        defaultCompression: {
          ...DEFAULT_COMPRESSION_POLICY,
          ...(options.defaultCompression ?? {}),
        },
      },
    };

    const validatorsProvider: Provider = {
      provide: STORAGE_VALIDATORS,
      useFactory: (
        size: SizeValidator,
        mime: MimeTypeValidator,
        name: FilenameValidator,
        dim: DimensionsValidator,
      ) => [size, mime, name, dim],
      inject: [SizeValidator, MimeTypeValidator, FilenameValidator, DimensionsValidator],
    };

    const imageProcessorProvider: Provider = {
      provide: STORAGE_IMAGE_PROCESSOR,
      useExisting: SharpImageProcessor,
    };

    const providers: Provider[] = [
      configProvider,
      SizeValidator,
      MimeTypeValidator,
      FilenameValidator,
      DimensionsValidator,
      validatorsProvider,
      FileValidationService,
      SharpImageProcessor,
      imageProcessorProvider,
      ...buildLocalProviders(),
      ...buildSupabaseProviders(),
      buildStorageProvider(),
      LocalStreamGuard,
      StorageService,
    ];

    return {
      module: StorageModule,
      global: options.global ?? false,
      providers,
      controllers: [LocalStorageController],
      exports: [
        StorageService,
        FileValidationService,
        STORAGE_CONFIG,
        STORAGE_PROVIDER,
        STORAGE_IMAGE_PROCESSOR,
      ],
    };
  }
}

function buildLocalProviders(): Provider[] {
  return [
    {
      provide: LOCAL_STORAGE_BASE_PATH,
      useFactory: (config: ConfigService<EnvironmentConfig>) =>
        config.get<string>('STORAGE_LOCAL_PATH') ?? './uploads',
      inject: [ConfigService],
    },
    {
      provide: LOCAL_STORAGE_PUBLIC_BASE_URL,
      useFactory: (config: ConfigService<EnvironmentConfig>) => config.get<string>('APP_URL') ?? '',
      inject: [ConfigService],
    },
    {
      provide: LOCAL_STORAGE_SIGNING_SECRET,
      useFactory: (config: ConfigService<EnvironmentConfig>) =>
        config.getOrThrow<string>('STORAGE_SIGNING_SECRET'),
      inject: [ConfigService],
    },
    LocalSigningService,
    LocalStorageProvider,
  ];
}

function buildSupabaseProviders(): Provider[] {
  return [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (config: ConfigService<EnvironmentConfig>) => {
        // Build the client only for the active driver: createClient() spins up a
        // realtime WebSocket that throws on Node < 22 (no native WebSocket).
        const driver = config.get<StorageDriver>('STORAGE_DRIVER') ?? StorageDriver.LOCAL;
        if (driver !== StorageDriver.SUPABASE) return null;
        const url = config.get<string>('STORAGE_SUPABASE_URL');
        const key = config.get<string>('STORAGE_SUPABASE_SECRET_KEY');
        if (!url || !key) return null;
        return createClient(url, key);
      },
      inject: [ConfigService],
    },
    {
      provide: SUPABASE_PUBLIC_BUCKET,
      useFactory: (config: ConfigService<EnvironmentConfig>) =>
        config.get<string>('STORAGE_SUPABASE_BUCKET_PUBLIC') ?? '',
      inject: [ConfigService],
    },
    {
      provide: SUPABASE_PRIVATE_BUCKET,
      useFactory: (config: ConfigService<EnvironmentConfig>) =>
        config.get<string>('STORAGE_SUPABASE_BUCKET_PRIVATE') ?? '',
      inject: [ConfigService],
    },
    SupabaseStorageProvider,
  ];
}

function buildStorageProvider(): Provider {
  return {
    provide: STORAGE_PROVIDER,
    useFactory: (
      config: ConfigService<EnvironmentConfig>,
      local: LocalStorageProvider,
      supabase: SupabaseStorageProvider,
    ) => {
      const driver = config.get<StorageDriver>('STORAGE_DRIVER') ?? StorageDriver.LOCAL;
      return driver === StorageDriver.SUPABASE ? supabase : local;
    },
    inject: [ConfigService, LocalStorageProvider, SupabaseStorageProvider],
  };
}
