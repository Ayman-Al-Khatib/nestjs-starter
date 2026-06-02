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
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { CacheKeys, CacheService } from 'infrastructure/cache';
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
    private readonly refreshTokenService: RefreshTokenService,
    private readonly cacheService: CacheService,
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
    const current = await this.reloadManaged(user);

    const stored = await this.storageService.upload(MulterAdapter.toUploadInput(file), {
      visibility: Visibility.PUBLIC,
      folder: 'avatars/users',
    });

    if (current.photoKey) {
      await this.storageService.delete(current.photoKey).catch(() => undefined);
    }

    const saved = await this.userRepository.mergeAndSave(current, { photoKey: stored.key });
    await this.invalidateAuthCache(saved.id);
    return saved;
  }

  async updateMe(user: UserEntity, dto: UpdateUserMeDto): Promise<UserEntity> {
    if (dto.cityId !== undefined && dto.cityId !== null) {
      await this.cityService.assertExists(dto.cityId);
    }
    const current = await this.reloadManaged(user);
    const saved = await this.userRepository.mergeAndSave(current, dto);
    await this.invalidateAuthCache(saved.id);
    return saved;
  }

  async completeProfile(user: UserEntity, dto: CompleteUserProfileDto): Promise<UserEntity> {
    const current = await this.reloadManaged(user);
    if (current.isProfileCompleted) {
      throw new BadRequestException(this.translator.tr('user.errors.profile_already_completed'));
    }
    await this.cityService.assertExists(dto.cityId);
    const saved = await this.userRepository.mergeAndSave(current, {
      ...dto,
      isProfileCompleted: true,
    });
    await this.invalidateAuthCache(saved.id);
    return saved;
  }

  /**
   * Reloads a managed entity for the authenticated principal. The guard's
   * `request.user` is a plain JSON object under the Redis auth cache (no entity
   * prototype, dates as strings); writes must target a freshly loaded row.
   */
  private async reloadManaged(user: UserEntity): Promise<UserEntity> {
    return this.findByIdOrFail(user.id);
  }

  /** Drops the cached auth principal so a mutation reflects on the next request. */
  private invalidateAuthCache(id: number): Promise<void> {
    return this.cacheService.delete(CacheKeys.authUser(Role.USER, id));
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

  /**
   * Disables a user: blocks future authentication, kills active sessions, and
   * drops the cached principal so the change takes effect on the next request
   * rather than after the auth-cache TTL.
   */
  async deactivateByAdmin(id: number): Promise<UserEntity> {
    const user = await this.findByIdOrFail(id);
    const updated = await this.userRepository.mergeAndSave(user, { isActive: false });
    await this.refreshTokenService.revokeAllForUser(id, Role.USER);
    await this.invalidateAuthCache(id);
    return updated;
  }

  /**
   * Re-enables a user. Drops the cached principal so a stale `isActive:false`
   * entry (cached while the account was disabled) can't lock the user out of an
   * otherwise valid session after re-activation.
   */
  async activateByAdmin(id: number): Promise<UserEntity> {
    const user = await this.findByIdOrFail(id);
    const updated = await this.userRepository.mergeAndSave(user, { isActive: true });
    await this.invalidateAuthCache(id);
    return updated;
  }

  // ---------- Cross-module assertions ----------

  assertProfileCompleted(user: UserEntity): void {
    if (!user.isProfileCompleted) {
      throw new BadRequestException(this.translator.tr('user.errors.profile_not_completed'));
    }
  }
}
