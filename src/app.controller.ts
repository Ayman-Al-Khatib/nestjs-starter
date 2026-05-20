import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppInfo, AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getLandingPage(@Res() res: Response): void {
    res.type('text/html').send(this.appService.getLandingPage());
  }

  @Get('info')
  getAppInfo(): AppInfo {
    return this.appService.getAppInfo();
  }
}
