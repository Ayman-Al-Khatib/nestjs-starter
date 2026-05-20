import { AdminResponseDto } from './admin-response.dto';

export class AdminLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AdminResponseDto;

  constructor(accessToken: string, refreshToken: string, user: AdminResponseDto) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
  }
}
