import { Logger } from '@nestjs/common';

// Globally mute Nest's Logger during tests. Services, the global exception
// filter, and security paths log at the project's sanctioned Logger sites;
// that output is correct in production but pure noise in test runs — and the
// deliberate error/soft-failure tests make it look like a failure. Wired into
// both jest configs via setupFiles.
const noop = (): void => undefined;
jest.spyOn(Logger.prototype, 'log').mockImplementation(noop);
jest.spyOn(Logger.prototype, 'error').mockImplementation(noop);
jest.spyOn(Logger.prototype, 'warn').mockImplementation(noop);
jest.spyOn(Logger.prototype, 'debug').mockImplementation(noop);
jest.spyOn(Logger.prototype, 'verbose').mockImplementation(noop);
jest.spyOn(Logger.prototype, 'fatal').mockImplementation(noop);
