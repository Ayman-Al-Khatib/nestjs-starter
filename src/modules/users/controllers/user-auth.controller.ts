import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from 'core/decorators/public.decorator';
import { Translator } from 'infrastructure/i18n';
import { AuthThrottle } from 'infrastructure/throttle';
import { PhoneOtpRequestDto } from '../dto/phone-otp-request.dto';
import { PhoneOtpVerifyDto } from '../dto/phone-otp-verify.dto';
import { UserLoginResponseDto } from '../dto/user-login-response.dto';
import { UserAuthService } from '../services/user-auth.service';

@Public()
@Controller({ path: 'auth/user', version: '1' })
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly translator: Translator,
  ) {}

  @AuthThrottle()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(
    @Body() dto: PhoneOtpRequestDto,
  ): Promise<{ message: string; expiresAt: Date; cooldownSeconds: number; warning?: string }> {
    const result = await this.userAuthService.requestOtp(dto.phone);
    return {
      message: this.translator.tr('otp.messages.code_sent'),
      expiresAt: result.expiresAt,
      cooldownSeconds: result.cooldownSeconds,
      ...(result.dispatchWarning && { warning: result.dispatchWarning }),
    };
  }

  @AuthThrottle()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: PhoneOtpVerifyDto): Promise<UserLoginResponseDto> {
    return this.userAuthService.verifyOtp(dto.phone, dto.code);
  }
}
