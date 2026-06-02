// ========================================
// NestJS Core Imports
// ========================================
import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

// ========================================
// Third-Party Imports (i18n)
// ========================================
import { ScheduleModule } from '@nestjs/schedule';
import { i18nValidationErrorFactory } from 'nestjs-i18n';

// ========================================
// Application Core
// ========================================
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ========================================
// Common (Guards, Interceptors, Middlewares)
// ========================================
import { SnakeCaseInterceptor } from './core/interceptors/snake-case.interceptor';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { UtcDateSerializerInterceptor } from './core/interceptors/utc-date-serializer.interceptor';
import { CamelCaseMiddleware } from './core/middlewares/camel-case.middleware';
import { ParseQueryMiddleware } from './core/middlewares/parse-query.middleware';
import { RequestIdMiddleware } from './core/middlewares/request-id.middleware';

// ========================================
// Shared Modules & Services
// ========================================
import { CommonAuthModule } from 'core/auth';
import { AdminsModule } from 'modules/admins/admins.module';
import { AreasModule } from 'modules/areas/areas.module';
import { CitiesModule } from 'modules/cities/cities.module';
import { OtpsModule } from 'modules/otps/otps.module';
import { RefreshTokensModule } from 'modules/refresh-tokens/refresh-tokens.module';
import { UsersModule } from 'modules/users/users.module';
import { WhatsappModule } from 'modules/whatsapp/whatsapp.module';
import { AppI18nModule } from 'infrastructure/i18n';
import { PushNotificationModule } from 'infrastructure/notifications';
import { StorageModule } from 'infrastructure/storage';
import { WhatsAppModule } from 'infrastructure/whatsapp-client';
import { FiltersModule } from './core/filters';
import { AppCacheModule } from './infrastructure/cache';
import { AppConfigModule } from './infrastructure/config/app-config.module';
import { AppJwtModule } from './infrastructure/jwt/app-jwt.module';
import { AppDatabaseModule } from './infrastructure/database/app-database.module';
import { AppHealthModule } from './infrastructure/health';
import { AppThrottleModule } from './infrastructure/throttle';

@Module({
  imports: [
    // Core Infrastructure
    AppConfigModule,
    ScheduleModule.forRoot(),
    AppThrottleModule,
    AppI18nModule,
    AppDatabaseModule,
    AppJwtModule,
    StorageModule.forRoot({ global: true }),
    WhatsAppModule,
    AppCacheModule,
    AppHealthModule,
    PushNotificationModule,

    // Global error handling (registers GlobalExceptionFilter as APP_FILTER)
    FiltersModule,

    // Cross-cutting auth (registry + JwtAuthGuard, global)
    CommonAuthModule,

    // Feature modules
    RefreshTokensModule,
    AdminsModule,
    OtpsModule,
    CitiesModule,
    AreasModule,
    UsersModule,
    WhatsappModule,
  ],

  controllers: [AppController],

  providers: [
    // ========================================
    // Core Services
    // ========================================
    AppService,
    ParseQueryMiddleware,

    // ========================================
    // Global Pipes
    // ========================================
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        exceptionFactory: i18nValidationErrorFactory,
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
        skipMissingProperties: false,
        skipNullProperties: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },

    // ========================================
    // Global Filters
    // GlobalExceptionFilter is registered by FiltersModule; it routes
    // I18nValidationException through I18nValidationErrorHandler so the
    // translated DTO messages flow into the standard error envelope.
    // ========================================

    // ========================================
    // Global Interceptors
    // ========================================
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UtcDateSerializerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // RequestIdMiddleware runs first so the correlation ID is attached
    // before any downstream middleware or filter can log.
    consumer
      .apply(RequestIdMiddleware, ParseQueryMiddleware, CamelCaseMiddleware)
      .forRoutes('/');
  }
}
