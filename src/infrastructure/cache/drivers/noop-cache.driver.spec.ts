import { NoopCacheDriver } from './noop-cache.driver';

describe('NoopCacheDriver', () => {
  const driver = new NoopCacheDriver();

  it('always reads null', async () => {
    await expect(driver.get('any')).resolves.toBeNull();
  });

  it('silently drops writes and deletes', async () => {
    await expect(driver.set('k', 'v', 30)).resolves.toBeUndefined();
    await expect(driver.delete('k')).resolves.toBeUndefined();
    await expect(driver.deletePattern('k:*')).resolves.toBeUndefined();
  });
});
