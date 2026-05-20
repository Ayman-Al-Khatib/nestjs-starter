import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthThrottle } from 'infrastructure/throttle';

import { AdminLoginResponseDto } from '../dto/admin-login-response.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminAuthService } from '../services/admin-auth.service';

@Controller({ path: 'auth/admin', version: '1' })
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @AuthThrottle() 
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(dto);
  }
}
