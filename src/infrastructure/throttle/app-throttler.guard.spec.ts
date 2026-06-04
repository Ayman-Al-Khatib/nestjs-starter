import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerRequest } from '@nestjs/throttler/dist/throttler.guard.interface';
import { createExecutionContext } from 'test-utils/test-helpers';
import {
  AppThrottlerGuard,
  AUTH_THROTTLE_METADATA,
  UPLOAD_THROTTLE_METADATA,
} from './app-throttler.guard';

type Handleable = { handleRequest: (r: ThrottlerRequest) => Promise<boolean> };

function invoke(guard: AppThrottlerGuard, name: string): Promise<boolean> {
  const request = {
    throttler: { name },
    context: createExecutionContext(),
  } as unknown as ThrottlerRequest;
  return (guard as unknown as Handleable).handleRequest(request);
}

describe('AppThrottlerGuard', () => {
  let guard: AppThrottlerGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let superHandle: jest.SpyInstance;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = Object.create(AppThrottlerGuard.prototype) as AppThrottlerGuard;
    (guard as unknown as { reflector: typeof reflector }).reflector = reflector;
    // handleRequest is protected on ThrottlerGuard — cast the prototype to spy on it.
    const proto = ThrottlerGuard.prototype as unknown as Handleable;
    superHandle = jest.spyOn(proto, 'handleRequest').mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('lets non-active throttlers pass through without rate-limiting', async () => {
    // Unmarked route → active throttler is "default"; the "auth" budget is skipped.
    await expect(invoke(guard, 'auth')).resolves.toBe(true);
    expect(superHandle).not.toHaveBeenCalled();
  });

  it('runs the default throttler for an unmarked route', async () => {
    await invoke(guard, 'default');
    expect(superHandle).toHaveBeenCalledTimes(1);
  });

  it('activates only the auth throttler when @AuthThrottle() is present', async () => {
    reflector.getAllAndOverride.mockImplementation(
      (key: string) => key === AUTH_THROTTLE_METADATA,
    );
    await invoke(guard, 'default');
    expect(superHandle).not.toHaveBeenCalled();

    await invoke(guard, 'auth');
    expect(superHandle).toHaveBeenCalledTimes(1);
  });

  it('activates only the upload throttler when @UploadThrottle() is present', async () => {
    reflector.getAllAndOverride.mockImplementation(
      (key: string) => key === UPLOAD_THROTTLE_METADATA,
    );
    await invoke(guard, 'upload');
    expect(superHandle).toHaveBeenCalledTimes(1);
  });
});
