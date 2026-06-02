import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { AuthUserResolver } from 'core/auth/auth-user-resolver.interface';
import { UserResolverRegistry } from 'core/auth/user-resolver.registry';
import { Role } from 'domain/enums/role.enum';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { CacheKeys, CacheService } from 'infrastructure/cache';
import { Translator } from 'infrastructure/i18n';
import { Visibility } from 'infrastructure/storage/core/enums/visibility.enum';
import { MulterAdapter, MulterFile } from 'infrastructure/storage/http/multer.adapter';
import { StorageService } from 'infrastructure/storage/service/storage.service';
import { AdminResponseDto } from '../dto/admin-response.dto';
import { UpdateMeDto } from '../dto/update-me.dto';
import { AdminEntity } from '../entities/admin.entity';
import { AdminRepository } from '../repositories/admin.repository';

/**
 * Public face of the Admin module. Exposes only the methods other
 * modules (and the JwtAuthGuard) need; never leaks the repository.
 *
 * Registers itself with UserResolverRegistry on module init so the
 * guard can hydrate the principal for ADMIN tokens.
 */
@Injectable()
export class AdminService implements OnModuleInit, AuthUserResolver<AdminEntity> {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userResolvers: UserResolverRegistry,
    private readonly storageService: StorageService,
    private readonly translator: Translator,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit(): void {
    this.userResolvers.register(Role.ADMIN, this);
  }

  findByIdForAuth(id: number): Promise<AdminEntity | null> {
    return this.adminRepository.findById(id);
  }

  findByUsername(username: string): Promise<AdminEntity | null> {
    return this.adminRepository.findByUsername(username);
  }

  private async findByIdOrFail(id: number): Promise<AdminEntity> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new UnauthorizedException(this.translator.tr('admin.errors.invalid_credentials'));
    }
    return admin;
  }

  /** Drops the cached auth principal so a mutation reflects on the next request. */
  private invalidateAuthCache(id: number): Promise<void> {
    return this.cacheService.delete(CacheKeys.authUser(Role.ADMIN, id));
  }

  async resolvePhotoUrl(key: string | null): Promise<string | null> {
    if (!key) return null;
    const { url } = await this.storageService.getAccessUrl(key);
    return url;
  }

  async buildResponseDto(admin: AdminEntity): Promise<AdminResponseDto> {
    const photoUrl = await this.resolvePhotoUrl(admin.photoKey);
    return AdminResponseDto.fromEntity(admin, photoUrl);
  }

  async uploadPhoto(admin: AdminEntity, file: MulterFile): Promise<AdminEntity> {
    // Reload a managed row: under the Redis auth cache the principal is a plain
    // JSON object without entity prototype, so writes must target a fresh entity.
    const current = await this.findByIdOrFail(admin.id);

    const stored = await this.storageService.upload(MulterAdapter.toUploadInput(file), {
      visibility: Visibility.PUBLIC,
      folder: 'avatars/admins',
    });

    if (current.photoKey) {
      await this.storageService.delete(current.photoKey).catch(() => undefined);
    }

    const saved = await this.adminRepository.mergeAndSave(current, { photoKey: stored.key });
    await this.invalidateAuthCache(saved.id);
    return saved;
  }

  /**
   * Single update entry point for an authenticated admin's own row.
   * Accepts any subset of profile fields. When `username` or `password`
   * is being changed, `currentPassword` must be provided and verified.
   *
   * Strategy:
   *   - DTO + ValidationPipe handle structural checks (presence, type,
   *     length, conditional `currentPassword`).
   *   - This service handles only **business** rules — uniqueness and
   *     password verification — both require DB or computation.
   *   - `mergeAndSave` applies the remaining fields uniformly.
   */
  async updateMe(admin: AdminEntity, dto: UpdateMeDto): Promise<AdminEntity> {
    const isChangingCredentials = dto.username !== undefined || dto.password !== undefined;

    // Reload as a managed entity carrying the password hash. The principal from
    // the auth guard omits the password (select:false) and, under the Redis
    // cache, is a plain object without entity methods — so the credential check
    // and the @BeforeUpdate hash hook must run against a freshly loaded row.
    const current = await this.adminRepository.findByIdWithPassword(admin.id);
    if (!current) {
      throw new UnauthorizedException(this.translator.tr('admin.errors.invalid_credentials'));
    }

    if (isChangingCredentials) {
      // DTO already guaranteed currentPassword is a non-empty string here.
      const valid = await current.checkPassword(dto.currentPassword!);
      if (!valid) {
        throw new UnauthorizedException(
          this.translator.tr('admin.errors.current_password_incorrect'),
        );
      }
    }

    if (dto.username !== undefined && dto.username !== current.username) {
      const existing = await this.adminRepository.findByUsername(dto.username);
      if (existing && existing.id !== current.id) {
        throw new ConflictException(this.translator.tr('admin.errors.username_taken'));
      }
    }

    // Drop non-column fields (e.g. currentPassword) before merging onto the entity.
    const { currentPassword: _currentPassword, ...changes } = dto;

    const saved = await this.adminRepository.mergeAndSave(current, changes);

    if (isChangingCredentials) {
      // Rotated credentials kill every active session.
      await this.refreshTokenService.revokeAllForUser(admin.id, Role.ADMIN);
    }
    // Always drop the cached principal so any profile/credential change takes
    // effect on the next request rather than after the cache TTL.
    await this.invalidateAuthCache(admin.id);

    return saved;
  }
}
