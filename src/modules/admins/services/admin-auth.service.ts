import { Injectable, UnauthorizedException } from '@nestjs/common';

import { Role } from 'domain/enums/role.enum';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { Translator } from 'infrastructure/i18n';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';

import { AdminLoginResponseDto } from '../dto/admin-login-response.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminResponseDto } from '../dto/admin-response.dto';
import { AdminEntity } from '../entities/admin.entity';
import { AdminService } from './admin.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: AppJwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly translator: Translator,
  ) {}

  async login(dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const admin = await this.adminService.findByUsername(dto.username);
    if (!admin) {
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

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException(this.translator.tr('admin.errors.invalid_credentials'));
  }
}
