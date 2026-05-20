import { UserResponseDto } from './user-response.dto';

export class UserLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
  requiresProfileCompletion: boolean;

  constructor(
    accessToken: string,
    refreshToken: string,
    user: UserResponseDto,
    requiresProfileCompletion: boolean,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
    this.requiresProfileCompletion = requiresProfileCompletion;
  }
}
