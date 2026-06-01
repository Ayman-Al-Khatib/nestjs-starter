import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from 'core/decorators/public.decorator';
import { Translator } from 'infrastructure/i18n';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { AuthThrottle } from 'infrastructure/throttle';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshRequestDto } from '../dto/refresh-request.dto';
import { RefreshResponseDto } from '../dto/refresh-response.dto';
import { RefreshTokenService } from '../services/refresh-token.service';

/**
 * Unified session-management endpoints shared by all roles.
 * Role is embedded in the opaque token's DB record — the client
 * uses the same URLs regardless of being admin or user.
 *
 * POST /v1/auth/refresh  { refreshToken }  → new rotated token pair
 * POST /v1/auth/logout   { refreshToken }  → revoke this session
 */
@Public()
@Controller({ path: 'auth', version: '1' })
export class RefreshTokenController {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: AppJwtService,
    private readonly translator: Translator,
  ) {}

  @AuthThrottle()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshRequestDto): Promise<RefreshResponseDto> {
    const rotated = await this.refreshTokenService.rotate(dto.refreshToken);

    const accessToken = this.jwtService.createAccessToken({
      userId: rotated.userId,
      role: rotated.role,
    });

    return new RefreshResponseDto(accessToken, rotated.token, rotated.role);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    await this.refreshTokenService.revoke(dto.refreshToken);
    return { message: this.translator.tr('auth.messages.logout_success') };
  }
}
