import { Response } from 'express';
import { AppController } from './app.controller';
import { AppInfo, AppService } from './app.service';

describe('AppController', () => {
  let appService: { getAppInfo: jest.Mock; getLandingPage: jest.Mock };
  let controller: AppController;

  beforeEach(() => {
    appService = {
      getAppInfo: jest.fn().mockReturnValue({ status: 'ok' } as AppInfo),
      getLandingPage: jest.fn().mockReturnValue('<html></html>'),
    };
    controller = new AppController(appService as unknown as AppService);
  });

  it('returns app info from the service', () => {
    expect(controller.getAppInfo()).toEqual({ status: 'ok' });
  });

  it('sends the landing page as HTML', () => {
    const send = jest.fn();
    const res = { type: jest.fn().mockReturnValue({ send }) } as unknown as Response;
    controller.getLandingPage(res);
    expect(res.type).toHaveBeenCalledWith('text/html');
    expect(send).toHaveBeenCalledWith('<html></html>');
  });
});
