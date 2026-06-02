import { AdminEntity } from '../entities/admin.entity';
import { AdminService } from '../services/admin.service';
import { AdminController } from './admin.controller';

describe('AdminController', () => {
  let service: { buildResponseDto: jest.Mock; uploadPhoto: jest.Mock; updateMe: jest.Mock };
  let controller: AdminController;
  const admin = { id: 1, username: 'root' } as AdminEntity;

  beforeEach(() => {
    service = {
      buildResponseDto: jest.fn().mockResolvedValue({ id: 1, username: 'root' }),
      uploadPhoto: jest.fn().mockResolvedValue({ id: 1, photoKey: 'k' }),
      updateMe: jest.fn().mockResolvedValue({ id: 1, username: 'new' }),
    };
    controller = new AdminController(service as unknown as AdminService);
  });

  it('returns the current admin profile', async () => {
    await controller.me(admin);
    expect(service.buildResponseDto).toHaveBeenCalledWith(admin);
  });

  it('uploads a photo then returns the refreshed profile', async () => {
    const file = { originalname: 'a.png' } as never;
    await controller.uploadPhoto(admin, file);
    expect(service.uploadPhoto).toHaveBeenCalledWith(admin, file);
    expect(service.buildResponseDto).toHaveBeenCalledWith({ id: 1, photoKey: 'k' });
  });

  it('updates the profile then returns the refreshed DTO', async () => {
    await controller.updateMe(admin, { username: 'new' });
    expect(service.updateMe).toHaveBeenCalledWith(admin, { username: 'new' });
    expect(service.buildResponseDto).toHaveBeenCalledWith({ id: 1, username: 'new' });
  });
});
