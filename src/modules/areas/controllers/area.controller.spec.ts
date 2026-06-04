import { AreaEntity } from '../entities/area.entity';
import { AreaService } from '../services/area.service';
import { AreaController } from './area.controller';

function area(id = 1): AreaEntity {
  return { id, cityId: 1, nameEn: 'Mezzeh', nameAr: 'المزة' } as AreaEntity;
}

describe('AreaController', () => {
  let service: {
    list: jest.Mock;
    findByIdOrFail: jest.Mock;
    createForAdmin: jest.Mock;
    updateForAdmin: jest.Mock;
    deleteForAdmin: jest.Mock;
  };
  let controller: AreaController;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue({
        data: [area(1)],
        pagination: { total: 1, page: 1, limit: 10 },
      }),
      findByIdOrFail: jest.fn().mockResolvedValue(area(1)),
      createForAdmin: jest.fn().mockResolvedValue(area(2)),
      updateForAdmin: jest.fn().mockResolvedValue(area(1)),
      deleteForAdmin: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AreaController(service as unknown as AreaService);
  });

  it('lists areas as a paginated DTO envelope', async () => {
    const result = await controller.findAll({ page: 1, limit: 10 } as never);
    expect(service.list).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('returns one area by id', async () => {
    const result = await controller.findOne(1);
    expect(service.findByIdOrFail).toHaveBeenCalledWith(1);
    expect(result.id).toBe(1);
  });

  it('creates / updates / deletes via the admin paths', async () => {
    await controller.adminCreate({ cityId: 1, nameEn: 'A', nameAr: 'ا' });
    expect(service.createForAdmin).toHaveBeenCalled();

    await controller.adminUpdate(1, { nameEn: 'B' });
    expect(service.updateForAdmin).toHaveBeenCalledWith(1, { nameEn: 'B' });

    await controller.adminDelete(1);
    expect(service.deleteForAdmin).toHaveBeenCalledWith(1);
  });
});
