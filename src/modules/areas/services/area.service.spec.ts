import { ConflictException, NotFoundException } from '@nestjs/common';
import { CityService } from 'modules/cities/services/city.service';
import { createTranslatorMock } from 'test-utils/test-helpers';
import { AreaEntity } from '../entities/area.entity';
import { AreaRepository } from '../repositories/area.repository';
import { AreaService } from './area.service';

function area(over: Partial<AreaEntity> = {}): AreaEntity {
  return { id: 1, cityId: 1, nameEn: 'Mezzeh', nameAr: 'المزة', ...over } as AreaEntity;
}

describe('AreaService', () => {
  let repo: {
    paginate: jest.Mock;
    findById: jest.Mock;
    existsById: jest.Mock;
    findByCityAndNameEn: jest.Mock;
    findByCityAndNameAr: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    mergeAndSave: jest.Mock;
    deleteById: jest.Mock;
  };
  let cityService: { assertExists: jest.Mock };
  let service: AreaService;
  const translator = createTranslatorMock();

  beforeEach(() => {
    repo = {
      paginate: jest.fn(),
      findById: jest.fn(),
      existsById: jest.fn(),
      findByCityAndNameEn: jest.fn().mockResolvedValue(null),
      findByCityAndNameAr: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => d),
      save: jest.fn((a) => Promise.resolve(a)),
      mergeAndSave: jest.fn((a, c) => Promise.resolve({ ...a, ...c })),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };
    cityService = { assertExists: jest.fn().mockResolvedValue(undefined) };
    service = new AreaService(
      repo as unknown as AreaRepository,
      cityService as unknown as CityService,
      translator,
    );
  });

  it('delegates list to the repository paginate', async () => {
    repo.paginate.mockResolvedValue({ data: [], pagination: {} });
    await service.list({ page: 1, limit: 10 } as never);
    expect(repo.paginate).toHaveBeenCalled();
  });

  describe('findByIdOrFail', () => {
    it('returns the area when present', async () => {
      repo.findById.mockResolvedValue(area());
      await expect(service.findByIdOrFail(1)).resolves.toMatchObject({ id: 1 });
    });
    it('throws 404 when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findByIdOrFail(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateCityAndArea', () => {
    it('returns the area when it belongs to the city', async () => {
      repo.findById.mockResolvedValue(area({ cityId: 7 }));
      await expect(service.validateCityAndArea(1, 7)).resolves.toMatchObject({ id: 1 });
    });
    it('throws 404 when the area is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.validateCityAndArea(1, 7)).rejects.toThrow(NotFoundException);
    });
    it('throws 409 when the area is in a different city', async () => {
      repo.findById.mockResolvedValue(area({ cityId: 2 }));
      await expect(service.validateCityAndArea(1, 7)).rejects.toThrow(ConflictException);
    });
  });

  describe('createForAdmin', () => {
    it('validates the city then creates when names are free', async () => {
      await service.createForAdmin({ cityId: 1, nameEn: 'Kafarsouseh', nameAr: 'كفرسوسة' });
      expect(cityService.assertExists).toHaveBeenCalledWith(1);
      expect(repo.save).toHaveBeenCalled();
    });
    it('rejects a duplicate English name in the city', async () => {
      repo.findByCityAndNameEn.mockResolvedValue(area());
      await expect(
        service.createForAdmin({ cityId: 1, nameEn: 'Mezzeh', nameAr: 'x' }),
      ).rejects.toThrow(ConflictException);
    });
    it('rejects a duplicate Arabic name in the city', async () => {
      repo.findByCityAndNameAr.mockResolvedValue(area());
      await expect(
        service.createForAdmin({ cityId: 1, nameEn: 'x', nameAr: 'المزة' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateForAdmin', () => {
    beforeEach(() => repo.findById.mockResolvedValue(area()));

    it('validates the city when cityId changes', async () => {
      await service.updateForAdmin(1, { cityId: 9 });
      expect(cityService.assertExists).toHaveBeenCalledWith(9);
      expect(repo.mergeAndSave).toHaveBeenCalled();
    });

    it('rejects a name colliding with another area in the city', async () => {
      repo.findByCityAndNameEn.mockResolvedValue(area({ id: 2 }));
      await expect(service.updateForAdmin(1, { nameEn: 'Other' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteForAdmin', () => {
    beforeEach(() => repo.findById.mockResolvedValue(area()));

    it('deletes an existing area', async () => {
      await service.deleteForAdmin(1);
      expect(repo.deleteById).toHaveBeenCalledWith(1);
    });
    it('translates an FK RESTRICT violation into a 409', async () => {
      repo.deleteById.mockRejectedValue({ code: '23503' });
      await expect(service.deleteForAdmin(1)).rejects.toThrow(ConflictException);
    });
    it('rethrows unrelated errors', async () => {
      const boom = new Error('nope');
      repo.deleteById.mockRejectedValue(boom);
      await expect(service.deleteForAdmin(1)).rejects.toThrow(boom);
    });
  });
});
