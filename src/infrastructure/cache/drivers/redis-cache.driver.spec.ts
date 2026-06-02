const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  unlink: jest.fn().mockResolvedValue(1),
  scanStream: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => mockRedisClient),
}));

import { RedisCacheDriver } from './redis-cache.driver';

function buildDriver(keyPrefix = 'app') {
  return new RedisCacheDriver({ host: 'localhost', port: 6379, db: 0, keyPrefix });
}

describe('RedisCacheDriver', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prefixes keys (appending a colon when missing) and JSON-decodes reads', async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ id: 1 }));
    const driver = buildDriver('app');

    await expect(driver.get<{ id: number }>('auth:user:1')).resolves.toEqual({ id: 1 });
    expect(mockRedisClient.get).toHaveBeenCalledWith('app:auth:user:1');
  });

  it('returns null for a missing key without parsing', async () => {
    mockRedisClient.get.mockResolvedValue(null);
    await expect(buildDriver().get('missing')).resolves.toBeNull();
  });

  it('JSON-encodes writes with an EX ttl', async () => {
    await buildDriver('app').set('k', { a: 1 }, 60);
    expect(mockRedisClient.set).toHaveBeenCalledWith('app:k', JSON.stringify({ a: 1 }), 'EX', 60);
  });

  it('does not double the colon when keyPrefix already ends with one', async () => {
    await buildDriver('app:').set('k', 1, 10);
    expect(mockRedisClient.set).toHaveBeenCalledWith('app:k', '1', 'EX', 10);
  });

  it('unlinks (non-blocking delete) a single prefixed key', async () => {
    await buildDriver('app').delete('k');
    expect(mockRedisClient.unlink).toHaveBeenCalledWith('app:k');
  });

  it('SCANs and unlinks matched keys in deletePattern', async () => {
    mockRedisClient.scanStream.mockReturnValue(
      (async function* () {
        yield ['app:auth:user:1', 'app:auth:user:2'];
      })(),
    );
    await buildDriver('app').deletePattern('auth:user:*');
    expect(mockRedisClient.scanStream).toHaveBeenCalledWith(
      expect.objectContaining({ match: 'app:auth:user:*' }),
    );
    expect(mockRedisClient.unlink).toHaveBeenCalledWith('app:auth:user:1', 'app:auth:user:2');
  });

  it('skips unlink for an empty SCAN batch', async () => {
    mockRedisClient.scanStream.mockReturnValue(
      (async function* () {
        yield [];
      })(),
    );
    await buildDriver('app').deletePattern('none:*');
    expect(mockRedisClient.unlink).not.toHaveBeenCalled();
  });

  it('quits the client on module destroy', async () => {
    await buildDriver().onModuleDestroy();
    expect(mockRedisClient.quit).toHaveBeenCalled();
  });
});
