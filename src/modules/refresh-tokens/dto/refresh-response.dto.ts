import { Role } from "domain/enums/role.enum";

export class RefreshResponseDto {
  role:Role;
  accessToken: string;
  refreshToken: string;


  constructor(accessToken: string, refreshToken: string, role: Role) {
    this.role = role;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
