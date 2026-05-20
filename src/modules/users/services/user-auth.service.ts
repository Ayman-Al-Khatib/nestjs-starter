import { Injectable } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';
import { OtpIssueResult } from 'modules/otps/dto/otp-issue-result.dto';
import { OtpPurpose } from 'modules/otps/enums/otp-purpose.enum';
import { OtpService } from 'modules/otps/services/otp.service';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { AppJwtService } from 'infrastructure/jwt/app-jwt.service';
import { UserLoginResponseDto } from '../dto/user-login-response.dto';
import { UserEntity } from '../entities/user.entity';
import { UserService } from './user.service';

/**
 * User authentication via phone + OTP. The user row is auto-provisioned
 * on first successful OTP verify — issuing an OTP for an unknown phone
 * is therefore fine.
 */
@Injectable()
export class UserAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly jwtService: AppJwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  requestOtp(phone: string): Promise<OtpIssueResult> {
    return this.otpService.issue(phone, OtpPurpose.USER_LOGIN);
  }

  async verifyOtp(phone: string, code: string): Promise<UserLoginResponseDto> {
    await this.otpService.verify(phone, OtpPurpose.USER_LOGIN, code);

    const user = await this.userService.findOneOrCreateByPhone(phone);
    const accessToken = this.createAccessToken(user);
    const refresh = await this.refreshTokenService.issue(user.id, Role.USER);

    const userResponseDto = await this.userService.buildResponseDto(user);

    return new UserLoginResponseDto(
      accessToken,
      refresh.token,
      userResponseDto,
      !user.isProfileCompleted,
    );
  }

  private createAccessToken(user: UserEntity): string {
    return this.jwtService.createAccessToken({ userId: user.id, role: Role.USER });
  }
}
