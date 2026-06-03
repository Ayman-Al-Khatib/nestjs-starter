// E2E environment bootstrap. Loaded via jest-e2e.json `setupFiles`.
//
// Runs in the "test" environment (committed env/.env.test, no real secrets) so
// the app boots with synchronize=false and migrationsRun=true: the schema is
// built from migrations only, matching production. Forcing "development" here
// would flip synchronize on, and the suite's explicit runMigrations() would
// then collide with the just-synchronized types (duplicate CREATE TYPE).
process.env.NODE_ENV = 'test';

// Force the deterministic / infra-free drivers for tests.
process.env.CACHE_DRIVER = 'noop';
process.env.WHATSAPP_DRIVER = 'stub';
process.env.STORAGE_DRIVER = 'local';
// Makes the OTP that the service persists predictable for the user-login flow.
process.env.OTP_FIXED_CODE = process.env.OTP_FIXED_CODE ?? '000000';
