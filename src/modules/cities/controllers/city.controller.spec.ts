import { CityEntity } from '../entities/city.entity';
import { CityService } from '../services/city.service';
import { CityController } from './city.controller';

function city(id = 1): CityEntity {
  return { id, nameEn: 'Damascus', nameAr: 'دمشق' } as CityEntity;
}

describe('CityController', () => {
  let service: {
    list: jest.Mock;
    findByIdOrFail: jest.Mock;
    createForAdmin: jest.Mock;
    updateForAdmin: jest.Mock;
    deleteForAdmin: jest.Mock;
  };
  let controller: CityController;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([city(1), city(2)]),
      findByIdOrFail: jest.fn().mockResolvedValue(city(1)),
      createForAdmin: jest.fn().mockResolvedValue(city(3)),
      updateForAdmin: jest.fn().mockResolvedValue(city(1)),
      deleteForAdmin: jest.fn().mockResolvedValue(undefined),
    };
    controller = new CityController(service as unknown as CityService);
  });

  it('lists cities as response DTOs', async () => {
    const result = await controller.findAll();
    expect(service.list).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  it('returns a single city by id', async () => {
    const result = await controller.findOne(1);
    expect(service.findByIdOrFail).toHaveBeenCalledWith(1);
    expect(result.id).toBe(1);
  });

  it('creates a city via the admin path', async () => {
    const result = await controller.adminCreate({ nameEn: 'Homs', nameAr: 'حمص' });
    expect(service.createForAdmin).toHaveBeenCalled();
    expect(result.id).toBe(3);
  });

  it('updates a city via the admin path', async () => {
    await controller.adminUpdate(1, { nameEn: 'Damascus' });
    expect(service.updateForAdmin).toHaveBeenCalledWith(1, { nameEn: 'Damascus' });
  });

  it('deletes a city via the admin path', async () => {
    await controller.adminDelete(1);
    expect(service.deleteForAdmin).toHaveBeenCalledWith(1);
  });
});
