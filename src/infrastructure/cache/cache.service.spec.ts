import { ICacheDriver } from './drivers/cache-driver.interface';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let driver: jest.Mocked<ICacheDriver>;
  let service: CacheService;

  beforeEach(() => {
    driver = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      deletePattern: jest.fn().mockResolvedValue(undefined),
    };
    service = new CacheService(driver);
  });

  it('delegates get/set/delete/deletePattern to the driver', async () => {
    driver.get.mockResolvedValue('v');
    await expect(service.get('k')).resolves.toBe('v');

    await service.set('k', 'v', 30);
    expect(driver.set).toHaveBeenCalledWith('k', 'v', 30);

    await service.delete('k');
    expect(driver.delete).toHaveBeenCalledWith('k');

    await service.deletePattern('auth:user:*');
    expect(driver.deletePattern).toHaveBeenCalledWith('auth:user:*');
  });

  describe('getOrSet', () => {
    it('returns the cached value and skips the factory on a hit', async () => {
      driver.get.mockResolvedValue('cached');
      const factory = jest.fn();
      await expect(service.getOrSet('k', factory, 30)).resolves.toBe('cached');
      expect(factory).not.toHaveBeenCalled();
      expect(driver.set).not.toHaveBeenCalled();
    });

    it('runs the factory and caches its result on a miss', async () => {
      driver.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue('fresh');
      await expect(service.getOrSet('k', factory, 30)).resolves.toBe('fresh');
      expect(driver.set).toHaveBeenCalledWith('k', 'fresh', 30);
    });

    it('does NOT cache a null factory result (avoids caching "not found")', async () => {
      driver.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue(null);
      await expect(service.getOrSet('k', factory, 30)).resolves.toBeNull();
      expect(driver.set).not.toHaveBeenCalled();
    });

    it('treats a cached falsy-but-defined value (0) as a hit', async () => {
      driver.get.mockResolvedValue(0);
      const factory = jest.fn();
      await expect(service.getOrSet('k', factory, 30)).resolves.toBe(0);
      expect(factory).not.toHaveBeenCalled();
    });
  });
});
