import { AppService } from './app.service';

describe('AppService', () => {
  const service = new AppService();

  describe('getAppInfo', () => {
    it('reports an ok status with package metadata', () => {
      const info = service.getAppInfo();
      expect(info.status).toBe('ok');
      expect(info.name).toBe('nestjs-starter');
      expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(info.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(info.timestamp).toMatch(/Z$/);
    });

    it('derives a human display name from the package name', () => {
      expect(service.getAppInfo().displayName).toBe('Nestjs Starter');
    });
  });

  describe('getLandingPage', () => {
    it('renders an HTML document containing the display name and version', () => {
      const html = service.getLandingPage();
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('Nestjs Starter');
      expect(html).toContain(service.getAppInfo().version);
    });
  });
});
