import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserResolverRegistry } from 'core/auth/user-resolver.registry';
import { Role } from 'domain/enums/role.enum';
import { CacheService } from 'infrastructure/cache';
import { StorageService } from 'infrastructure/storage/service/storage.service';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { AdminResponseDto } from '../dto/admin-response.dto';
import { AdminEntity } from '../entities/admin.entity';
import { AdminRepository } from '../repositories/admin.repository';
import { AdminService } from './admin.service';

function admin(over: Partial<AdminEntity> = {}): AdminEntity {
  return {
    id: 1,
    username: 'root',
    photoKey: null,
    checkPassword: jest.fn().mockResolvedValue(true),
    ...over,
  } as unknown as AdminEntity;
}

describe('AdminService', () => {
  let repo: {
    findById: jest.Mock;
    findByIdWithPassword: jest.Mock;
    findByUsername: jest.Mock;
    mergeAndSave: jest.Mock;
  };
  let resolvers: { register: jest.Mock };
  let storageService: { getAccessUrl: jest.Mock; upload: jest.Mock; delete: jest.Mock };
  let refreshTokenService: { revokeAllForUser: jest.Mock };
  let cacheService: { delete: jest.Mock };
  let service: AdminService;
  const translator = createTranslatorMock();

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(admin()),
      findByIdWithPassword: jest.fn().mockResolvedValue(admin()),
      findByUsername: jest.fn().mockResolvedValue(null),
      mergeAndSave: jest.fn((a, c) => Promise.resolve({ ...a, ...c })),
    };
    resolvers = { register: jest.fn() };
    storageService = {
      getAccessUrl: jest.fn().mockResolvedValue({ url: 'https://cdn/p.png' }),
      upload: jest.fn().mockResolvedValue({ key: 'avatars/admins/new.png' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    refreshTokenService = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };
    cacheService = { delete: jest.fn().mockResolvedValue(undefined) };

    service = new AdminService(
      repo as unknown as AdminRepository,
      resolvers as unknown as UserResolverRegistry,
      storageService as unknown as StorageService,
      translator,
      refreshTokenService as unknown as RefreshTokenService,
      cacheService as unknown as CacheService,
    );
    jest.spyOn(AdminResponseDto, 'fromEntity').mockReturnValue({ id: 1 } as AdminResponseDto);
  });

  afterEach(() => jest.restoreAllMocks());

  it('registers itself as the ADMIN auth resolver on init', () => {
    service.onModuleInit();
    expect(resolvers.register).toHaveBeenCalledWith(Role.ADMIN, service);
  });

  it('findByIdForAuth / findByUsername delegate to the repository', async () => {
    await service.findByIdForAuth(1);
    expect(repo.findById).toHaveBeenCalledWith(1);
    await service.findByUsername('root');
    expect(repo.findByUsername).toHaveBeenCalledWith('root');
  });

  describe('resolvePhotoUrl', () => {
    it('returns null for a null key', async () => {
      await expect(service.resolvePhotoUrl(null)).resolves.toBeNull();
      expect(storageService.getAccessUrl).not.toHaveBeenCalled();
    });
    it('signs a URL for a present key', async () => {
      await expect(service.resolvePhotoUrl('k')).resolves.toBe('https://cdn/p.png');
    });
  });

  describe('uploadPhoto', () => {
    it('uploads, deletes the previous photo, and invalidates the auth cache', async () => {
      repo.findById.mockResolvedValue(admin({ photoKey: 'old.png' }));
      await service.uploadPhoto(admin(), { originalname: 'a.png' } as never);
      expect(storageService.upload).toHaveBeenCalled();
      expect(storageService.delete).toHaveBeenCalledWith('old.png');
      expect(cacheService.delete).toHaveBeenCalledWith('auth:user:admin:1');
    });

    it('skips deletion when there is no previous photo', async () => {
      repo.findById.mockResolvedValue(admin({ photoKey: null }));
      await service.uploadPhoto(admin(), { originalname: 'a.png' } as never);
      expect(storageService.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('updates non-credential fields without touching sessions', async () => {
      await service.updateMe(admin(), { fullName: 'New Name' } as never);
      expect(repo.mergeAndSave).toHaveBeenCalled();
      expect(refreshTokenService.revokeAllForUser).not.toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith('auth:user:admin:1');
    });

    it('requires the current password when changing credentials and revokes sessions', async () => {
      repo.findByIdWithPassword.mockResolvedValue(admin());
      await service.updateMe(admin(), { username: 'newname', currentPassword: 'pw' } as never);
      expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith(1, Role.ADMIN);
    });

    it('rejects a wrong current password', async () => {
      repo.findByIdWithPassword.mockResolvedValue(admin({ checkPassword: jest.fn().mockResolvedValue(false) }));
      await expect(
        service.updateMe(admin(), { password: 'x', currentPassword: 'wrong' } as never),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a username already taken by another admin', async () => {
      repo.findByIdWithPassword.mockResolvedValue(admin());
      repo.findByUsername.mockResolvedValue(admin({ id: 2, username: 'taken' }));
      await expect(
        service.updateMe(admin(), { username: 'taken', currentPassword: 'pw' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('throws when the managed row cannot be reloaded', async () => {
      repo.findByIdWithPassword.mockResolvedValue(null);
      await expect(service.updateMe(admin(), { fullName: 'x' } as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
