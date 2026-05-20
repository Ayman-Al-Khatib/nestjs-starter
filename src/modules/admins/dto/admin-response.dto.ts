import { Role } from 'domain/enums/role.enum';
import { AdminEntity } from '../entities/admin.entity';

/**
 * Public-facing shape of an admin account. Built explicitly from
 * AdminEntity so that adding new columns to the entity does NOT
 * leak them into API responses — fields must be opted in here.
 */
export class AdminResponseDto {
  id: number;
  role: Role.ADMIN = Role.ADMIN;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(admin: AdminEntity, resolvedPhotoUrl?: string | null): AdminResponseDto {
    const dto = new AdminResponseDto();
    dto.id = admin.id;
    dto.username = admin.username;
    dto.firstName = admin.firstName;
    dto.lastName = admin.lastName;
    dto.phone = admin.phone;
    dto.photoUrl = resolvedPhotoUrl ?? null;
    dto.createdAt = admin.createdAt;
    dto.updatedAt = admin.updatedAt;
    return dto;
  }
}
