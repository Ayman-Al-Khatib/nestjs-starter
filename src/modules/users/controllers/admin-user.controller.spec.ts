import { UserEntity } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { AdminUserController } from './admin-user.controller';

describe('AdminUserController', () => {
  let service: {
    findPageForAdmin: jest.Mock;
    createByAdmin: jest.Mock;
    findByIdOrFail: jest.Mock;
    deactivateByAdmin: jest.Mock;
    activateByAdmin: jest.Mock;
    buildResponseDto: jest.Mock;
  };
  let controller: AdminUserController;

  beforeEach(() => {
    service = {
      findPageForAdmin: jest.fn().mockResolvedValue({
        data: [{ id: 1 } as UserEntity],
        pagination: { total: 1, page: 1, limit: 10 },
      }),
      createByAdmin: jest.fn().mockResolvedValue({ id: 2 } as UserEntity),
      findByIdOrFail: jest.fn().mockResolvedValue({ id: 1 } as UserEntity),
      deactivateByAdmin: jest.fn().mockResolvedValue({ id: 1, isActive: false } as UserEntity),
      activateByAdmin: jest.fn().mockResolvedValue({ id: 1, isActive: true } as UserEntity),
      buildResponseDto: jest.fn().mockImplementation((u: UserEntity) => Promise.resolve(u)),
    };
    controller = new AdminUserController(service as unknown as UserService);
  });

  it('lists users as a paginated DTO envelope (async mapping)', async () => {
    const result = await controller.findAll({ page: 1, limit: 10 } as never);
    expect(service.findPageForAdmin).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(service.buildResponseDto).toHaveBeenCalled();
  });

  it('creates a user', async () => {
    await controller.create({ phone: '+963944123456', cityId: 1 } as never);
    expect(service.createByAdmin).toHaveBeenCalled();
  });

  it('fetches one user by id', async () => {
    await controller.findOne(1);
    expect(service.findByIdOrFail).toHaveBeenCalledWith(1);
  });

  it('deactivates and activates a user', async () => {
    await controller.deactivate(1);
    expect(service.deactivateByAdmin).toHaveBeenCalledWith(1);
    await controller.activate(1);
    expect(service.activateByAdmin).toHaveBeenCalledWith(1);
  });
});
