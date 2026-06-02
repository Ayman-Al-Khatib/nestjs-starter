// E2E environment bootstrap. Loaded via jest-e2e.json `setupFiles`.
//
// Uses the committed development env file (no real secrets) so the app's Zod
// env validation passes the moment AppModule is imported (ConfigModule.forRoot
// validates eagerly). Jest defaults NODE_ENV to "test", so force "development"
// here — setupFiles run before any spec imports AppModule. CI overrides DB_*
// via real process.env values (which @nestjs/config will not clobber) to point
// the suite at its Postgres service container.
process.env.NODE_ENV = 'development';

// Force the deterministic / infra-free drivers for tests.
process.env.CACHE_DRIVER = 'noop';
process.env.WHATSAPP_DRIVER = 'stub';
process.env.STORAGE_DRIVER = 'local';
// Makes the OTP that the service persists predictable for the user-login flow.
process.env.OTP_FIXED_CODE = process.env.OTP_FIXED_CODE ?? '000000';
