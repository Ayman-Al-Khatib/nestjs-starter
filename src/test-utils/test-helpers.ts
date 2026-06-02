import { ExecutionContext } from '@nestjs/common';
import { Translator } from 'infrastructure/i18n';

/**
 * Translator stub whose `tr` echoes the translation key, so specs can assert
 * on the key that a service/guard chose without booting nestjs-i18n.
 */
export function createTranslatorMock(): jest.Mocked<Pick<Translator, 'tr'>> & Translator {
  return {
    tr: jest.fn((key: string) => key),
  } as unknown as jest.Mocked<Pick<Translator, 'tr'>> & Translator;
}

interface ExecutionContextOverrides {
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  handler?: () => void;
  cls?: new () => unknown;
}

/**
 * Minimal HTTP ExecutionContext for guard/interceptor specs. `getHandler`
 * and `getClass` return stable references so a mocked Reflector can key off
 * them; the HTTP host exposes the supplied request/response.
 */
export function createExecutionContext(
  overrides: ExecutionContextOverrides = {},
): ExecutionContext {
  const handler = overrides.handler ?? ((): void => {});
  const cls = overrides.cls ?? class TestTarget {};
  const request = overrides.request ?? {};
  const response = overrides.response ?? {};

  return {
    switchToHttp: () => ({
      getRequest: <T>() => request as T,
      getResponse: <T>() => response as T,
      getNext: <T>() => undefined as T,
    }),
    getHandler: () => handler,
    getClass: () => cls,
    getArgs: () => [] as unknown[],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}
