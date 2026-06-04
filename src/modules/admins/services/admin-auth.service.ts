import { Injectable, UnauthorizedException } from '@nestjs/common';

import { Role } from 'domain/enums/role.enum';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { Translator } from 'infrastructure/i18n';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { comparePassword, hashPassword } from 'shared/utils';

import { AdminLoginResponseDto } from '../dto/admin-login-response.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminEntity } from '../entities/admin.entity';
import { AdminService } from './admin.service';

@Injectable()
export class AdminAuthService {
  // Lazily computed bcrypt hash used to equalize timing on the unknown-username
  // path, so response time can't be used to enumerate valid usernames.
  private dummyHash?: string;

  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: AppJwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly translator: Translator,
  ) {}

  async login(dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const admin = await this.adminService.findByUsername(dto.username);
    if (!admin) {
      await this.runDummyPasswordCompare(dto.password);
      throw this.invalidCredentials();
    }

    const passwordMatches = await admin.checkPassword(dto.password);
    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    const accessToken = this.createAccessToken(admin);
    const refresh = await this.refreshTokenService.issue(admin.id, Role.ADMIN);

    return new AdminLoginResponseDto(
      accessToken,
      refresh.token,
      await this.adminService.buildResponseDto(admin),
    );
  }

  private createAccessToken(admin: AdminEntity): string {
    return this.jwtService.createAccessToken({ userId: admin.id, role: Role.ADMIN });
  }

  /**
   * Runs a bcrypt comparison against a throwaway hash so the unknown-username
   * branch spends the same time as a real password check. The hash is computed
   * once at the configured cost factor and reused.
   */
  private async runDummyPasswordCompare(password: string): Promise<void> {
    this.dummyHash ??= await hashPassword('timing-equalizer-not-a-real-secret');
    await comparePassword(password, this.dummyHash);
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException(this.translator.tr('admin.errors.invalid_credentials'));
  }
}
