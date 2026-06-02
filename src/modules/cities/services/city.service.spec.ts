import { ConflictException, NotFoundException } from '@nestjs/common';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { CityEntity } from '../entities/city.entity';
import { CityRepository } from '../repositories/city.repository';
import { CityService } from './city.service';

function city(over: Partial<CityEntity> = {}): CityEntity {
  return { id: 1, nameEn: 'Damascus', nameAr: 'دمشق', ...over } as CityEntity;
}

describe('CityService', () => {
  let repo: jest.Mocked<
    Pick<
      CityRepository,
      | 'findAll'
      | 'findById'
      | 'existsById'
      | 'findByNameEn'
      | 'findByNameAr'
      | 'create'
      | 'save'
      | 'mergeAndSave'
      | 'deleteById'
    >
  >;
  let service: CityService;
  const translator = createTranslatorMock();

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      existsById: jest.fn(),
      findByNameEn: jest.fn().mockResolvedValue(null),
      findByNameAr: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => d as CityEntity),
      save: jest.fn((c) => Promise.resolve(c as CityEntity)),
      mergeAndSave: jest.fn((c, changes) => Promise.resolve({ ...c, ...changes } as CityEntity)),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };
    service = new CityService(repo as unknown as CityRepository, translator);
  });

  it('lists all cities', async () => {
    repo.findAll.mockResolvedValue([city()]);
    await expect(service.list()).resolves.toHaveLength(1);
  });

  describe('findByIdOrFail', () => {
    it('returns the city when present', async () => {
      repo.findById.mockResolvedValue(city());
      await expect(service.findByIdOrFail(1)).resolves.toMatchObject({ id: 1 });
    });
    it('throws 404 when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findByIdOrFail(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertExists', () => {
    it('resolves when the city exists', async () => {
      repo.existsById.mockResolvedValue(true);
      await expect(service.assertExists(1)).resolves.toBeUndefined();
    });
    it('throws 404 when it does not', async () => {
      repo.existsById.mockResolvedValue(false);
      await expect(service.assertExists(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createForAdmin', () => {
    it('creates when both names are free', async () => {
      await service.createForAdmin({ nameEn: 'Homs', nameAr: 'حمص' });
      expect(repo.save).toHaveBeenCalled();
    });
    it('rejects a duplicate English name', async () => {
      repo.findByNameEn.mockResolvedValue(city());
      await expect(service.createForAdmin({ nameEn: 'Damascus', nameAr: 'x' })).rejects.toThrow(
        ConflictException,
      );
    });
    it('rejects a duplicate Arabic name', async () => {
      repo.findByNameAr.mockResolvedValue(city());
      await expect(service.createForAdmin({ nameEn: 'x', nameAr: 'دمشق' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateForAdmin', () => {
    beforeEach(() => repo.findById.mockResolvedValue(city()));

    it('updates when names are unchanged', async () => {
      await service.updateForAdmin(1, { nameEn: 'Damascus' });
      expect(repo.mergeAndSave).toHaveBeenCalled();
    });

    it('rejects when the new English name belongs to another row', async () => {
      repo.findByNameEn.mockResolvedValue(city({ id: 2, nameEn: 'Aleppo' }));
      await expect(service.updateForAdmin(1, { nameEn: 'Aleppo' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows keeping the same English name (same row id)', async () => {
      repo.findByNameEn.mockResolvedValue(city({ id: 1, nameEn: 'Aleppo' }));
      await expect(service.updateForAdmin(1, { nameEn: 'Aleppo' })).resolves.toBeDefined();
    });
  });

  describe('deleteForAdmin', () => {
    beforeEach(() => repo.findById.mockResolvedValue(city()));

    it('deletes an existing city', async () => {
      await service.deleteForAdmin(1);
      expect(repo.deleteById).toHaveBeenCalledWith(1);
    });

    it('translates a Postgres FK violation into a 409 conflict', async () => {
      repo.deleteById.mockRejectedValue({ code: '23503' });
      await expect(service.deleteForAdmin(1)).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated errors untouched', async () => {
      const boom = new Error('disk full');
      repo.deleteById.mockRejectedValue(boom);
      await expect(service.deleteForAdmin(1)).rejects.toThrow(boom);
    });
  });
});
