import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { AuthUserResolver } from 'core/auth/auth-user-resolver.interface';
import { UserResolverRegistry } from 'core/auth/user-resolver.registry';
import { Role } from 'domain/enums/role.enum';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';
import { CityService } from 'modules/cities/services/city.service';
import { Translator } from 'infrastructure/i18n';
import { Visibility } from 'infrastructure/storage/core/enums/visibility.enum';
import { MulterAdapter, MulterFile } from 'infrastructure/storage/http/multer.adapter';
import { StorageService } from 'infrastructure/storage/service/storage.service';
import { CompleteUserProfileDto } from '../dto/complete-user-profile.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersAdminQueryDto } from '../dto/list-users-admin-query.dto';
import { UpdateUserMeDto } from '../dto/update-user-me.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

/**
 * Public face of the User module. Registers itself with
 * UserResolverRegistry on module init so JwtAuthGuard can hydrate
 * the principal for USER tokens.
 */
@Injectable()
export class UserService implements OnModuleInit, AuthUserResolver<UserEntity> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userResolvers: UserResolverRegistry,
    private readonly cityService: CityService,
    private readonly storageService: StorageService,
    private readonly translator: Translator,
  ) {}

  onModuleInit(): void {
    this.userResolvers.register(Role.USER, this);
  }

  // ---------- AuthUserResolver ----------

  async findByIdForAuth(id: number): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  // ---------- Facade lookups ----------

  findByPhone(phone: string): Promise<UserEntity | null> {
    return this.userRepository.findByPhone(phone);
  }

  async findByIdOrFail(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(this.translator.tr('user.errors.not_found'));
    }
    return user;
  }

  // ---------- Auth-side mutations ----------

  /**
   * First-login provisioning. Creates a stub user row keyed by phone
   * with `isProfileCompleted = false`. Returns the existing row when
   * one is already present so callers can use this as an idempotent
   * "find or create" for the OTP-verify path.
   */
  async findOneOrCreateByPhone(phone: string): Promise<UserEntity> {
    const existing = await this.userRepository.findByPhone(phone);
    if (existing) return existing;

    const created = this.userRepository.create({
      phone,
      isProfileCompleted: false,
    });
    return this.userRepository.save(created);
  }

  // ---------- User self-update ----------

  async resolvePhotoUrl(key: string | null): Promise<string | null> {
    if (!key) return null;
    const { url } = await this.storageService.getAccessUrl(key);
    return url;
  }

  async buildResponseDto(user: UserEntity): Promise<UserResponseDto> {
    const photoUrl = await this.resolvePhotoUrl(user.photoKey);
    return UserResponseDto.fromEntity(user, photoUrl);
  }

  async uploadPhoto(user: UserEntity, file: MulterFile): Promise<UserEntity> {
    const stored = await this.storageService.upload(MulterAdapter.toUploadInput(file), {
      visibility: Visibility.PUBLIC,
      folder: 'avatars/users',
    });

    if (user.photoKey) {
      await this.storageService.delete(user.photoKey).catch(() => undefined);
    }

    return this.userRepository.mergeAndSave(user, { photoKey: stored.key });
  }

  async updateMe(user: UserEntity, dto: UpdateUserMeDto): Promise<UserEntity> {
    if (dto.cityId !== undefined && dto.cityId !== null) {
      await this.cityService.assertExists(dto.cityId);
    }
    return this.userRepository.mergeAndSave(user, dto);
  }

  async completeProfile(user: UserEntity, dto: CompleteUserProfileDto): Promise<UserEntity> {
    if (user.isProfileCompleted) {
      throw new BadRequestException(this.translator.tr('user.errors.profile_already_completed'));
    }
    await this.cityService.assertExists(dto.cityId);
    return this.userRepository.mergeAndSave(user, {
      ...dto,
      isProfileCompleted: true,
    });
  }

  // ---------- Admin-side ----------

  findPageForAdmin(query: ListUsersAdminQueryDto): Promise<IPaginatedResponse<UserEntity>> {
    return this.userRepository.findPageForAdmin(query);
  }

  async createByAdmin(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.userRepository.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException(this.translator.tr('user.errors.phone_taken'));
    }
    await this.cityService.assertExists(dto.cityId);
    const user = this.userRepository.create({
      ...dto,
      isProfileCompleted: true,
    });
    return this.userRepository.save(user);
  }

  // ---------- Cross-module assertions ----------

  assertProfileCompleted(user: UserEntity): void {
    if (!user.isProfileCompleted) {
      throw new BadRequestException(this.translator.tr('user.errors.profile_not_completed'));
    }
  }
}
