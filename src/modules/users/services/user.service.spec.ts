import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserResolverRegistry } from 'core/auth/user-resolver.registry';
import { Role } from 'domain/enums/role.enum';
import { CacheService } from 'infrastructure/cache';
import { StorageService } from 'infrastructure/storage/service/storage.service';
import { CityService } from 'modules/cities/services/city.service';
import { RefreshTokenService } from 'modules/refresh-tokens/services/refresh-token.service';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from './user.service';

function user(over: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 1,
    phone: '+963944123456',
    isProfileCompleted: false,
    isActive: true,
    photoKey: null,
    cityId: null,
    ...over,
  } as UserEntity;
}

describe('UserService', () => {
  let repo: {
    findById: jest.Mock;
    findByPhone: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    mergeAndSave: jest.Mock;
    findPageForAdmin: jest.Mock;
  };
  let resolvers: { register: jest.Mock };
  let cityService: { assertExists: jest.Mock };
  let storageService: { getAccessUrl: jest.Mock };
  let refreshTokenService: { revokeAllForUser: jest.Mock };
  let cacheService: { delete: jest.Mock };
  let service: UserService;
  const translator = createTranslatorMock();

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByPhone: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => d),
      save: jest.fn((u) => Promise.resolve({ id: 99, ...u })),
      mergeAndSave: jest.fn((u, changes) => Promise.resolve({ ...u, ...changes })),
      findPageForAdmin: jest.fn(),
    };
    resolvers = { register: jest.fn() };
    cityService = { assertExists: jest.fn().mockResolvedValue(undefined) };
    storageService = { getAccessUrl: jest.fn() };
    refreshTokenService = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };
    cacheService = { delete: jest.fn().mockResolvedValue(undefined) };

    service = new UserService(
      repo as unknown as UserRepository,
      resolvers as unknown as UserResolverRegistry,
      cityService as unknown as CityService,
      storageService as unknown as StorageService,
      translator,
      refreshTokenService as unknown as RefreshTokenService,
      cacheService as unknown as CacheService,
    );
  });

  it('registers itself as the USER auth resolver on init', () => {
    service.onModuleInit();
    expect(resolvers.register).toHaveBeenCalledWith(Role.USER, service);
  });

  describe('findByIdOrFail', () => {
    it('returns the user when present', async () => {
      repo.findById.mockResolvedValue(user());
      await expect(service.findByIdOrFail(1)).resolves.toMatchObject({ id: 1 });
    });
    it('throws 404 when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findByIdOrFail(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneOrCreateByPhone', () => {
    it('returns the existing user (idempotent)', async () => {
      repo.findByPhone.mockResolvedValue(user({ id: 7 }));
      await expect(service.findOneOrCreateByPhone('+963944123456')).resolves.toMatchObject({
        id: 7,
      });
      expect(repo.save).not.toHaveBeenCalled();
    });
    it('provisions a stub user when none exists', async () => {
      repo.findByPhone.mockResolvedValue(null);
      await service.findOneOrCreateByPhone('+963944123456');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+963944123456', isProfileCompleted: false }),
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('resolvePhotoUrl', () => {
    it('returns null for a null key without hitting storage', async () => {
      await expect(service.resolvePhotoUrl(null)).resolves.toBeNull();
      expect(storageService.getAccessUrl).not.toHaveBeenCalled();
    });
    it('signs a URL for a present key', async () => {
      storageService.getAccessUrl.mockResolvedValue({ url: 'https://cdn/x.png' });
      await expect(service.resolvePhotoUrl('avatars/1.png')).resolves.toBe('https://cdn/x.png');
    });
  });

  describe('updateMe', () => {
    beforeEach(() => repo.findById.mockResolvedValue(user()));

    it('validates the city when cityId is provided and invalidates the cache', async () => {
      await service.updateMe(user(), { cityId: 3 });
      expect(cityService.assertExists).toHaveBeenCalledWith(3);
      expect(cacheService.delete).toHaveBeenCalledWith('auth:user:user:1');
    });

    it('skips city validation when cityId is omitted', async () => {
      await service.updateMe(user(), { firstName: 'Sara' } as never);
      expect(cityService.assertExists).not.toHaveBeenCalled();
    });
  });

  describe('completeProfile', () => {
    it('rejects when the profile is already completed', async () => {
      repo.findById.mockResolvedValue(user({ isProfileCompleted: true }));
      await expect(service.completeProfile(user(), { cityId: 2 } as never)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('marks the profile completed and validates the city', async () => {
      repo.findById.mockResolvedValue(user({ isProfileCompleted: false }));
      const saved = await service.completeProfile(user(), { cityId: 2 } as never);
      expect(cityService.assertExists).toHaveBeenCalledWith(2);
      expect(saved.isProfileCompleted).toBe(true);
    });
  });

  describe('createByAdmin', () => {
    it('rejects a phone already in use', async () => {
      repo.findByPhone.mockResolvedValue(user());
      await expect(
        service.createByAdmin({ phone: '+963944123456', cityId: 1 } as never),
      ).rejects.toThrow(ConflictException);
    });
    it('creates a completed user after validating the city', async () => {
      repo.findByPhone.mockResolvedValue(null);
      await service.createByAdmin({ phone: '+963944999888', cityId: 1 } as never);
      expect(cityService.assertExists).toHaveBeenCalledWith(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isProfileCompleted: true }),
      );
    });
  });

  describe('deactivateByAdmin / activateByAdmin', () => {
    beforeEach(() => repo.findById.mockResolvedValue(user()));

    it('disables the account, kills sessions, and drops the cache', async () => {
      const updated = await service.deactivateByAdmin(1);
      expect(updated.isActive).toBe(false);
      expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith(1, Role.USER);
      expect(cacheService.delete).toHaveBeenCalledWith('auth:user:user:1');
    });

    it('re-enables the account and drops the cache', async () => {
      const updated = await service.activateByAdmin(1);
      expect(updated.isActive).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith('auth:user:user:1');
    });
  });

  describe('assertProfileCompleted', () => {
    it('throws when the profile is incomplete', () => {
      expect(() => service.assertProfileCompleted(user({ isProfileCompleted: false }))).toThrow(
        BadRequestException,
      );
    });
    it('passes when complete', () => {
      expect(() =>
        service.assertProfileCompleted(user({ isProfileCompleted: true })),
      ).not.toThrow();
    });
  });

  it('delegates admin pagination to the repository', async () => {
    repo.findPageForAdmin.mockResolvedValue({ data: [], pagination: {} });
    await service.findPageForAdmin({ page: 1, limit: 10 } as never);
    expect(repo.findPageForAdmin).toHaveBeenCalled();
  });
});
