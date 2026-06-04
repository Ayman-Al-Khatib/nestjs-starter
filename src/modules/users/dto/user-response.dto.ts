import { Gender } from 'domain/enums/gender.enum';
import { Role } from 'domain/enums/role.enum';
import { UserEntity } from '../entities/user.entity';

/**
 * Public-facing shape of a user account. Built explicitly from
 * UserEntity so adding new columns does not silently leak them
 * into responses.
 */
export class UserResponseDto {
  id: number;
  role: Role.USER = Role.USER;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  gender: Gender | null;
  birthDate: Date | null;
  cityId: number | null;
  address: string | null;
  photoUrl: string | null;
  isProfileCompleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(user: UserEntity, resolvedPhotoUrl?: string | null): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.phone = user.phone;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.gender = user.gender;
    dto.birthDate = user.birthDate;
    dto.cityId = user.cityId;
    dto.address = user.address;
    dto.photoUrl = resolvedPhotoUrl ?? null;
    dto.isProfileCompleted = user.isProfileCompleted;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
