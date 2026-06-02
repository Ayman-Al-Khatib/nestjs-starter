import { UserEntity } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let service: {
    buildResponseDto: jest.Mock;
    updateMe: jest.Mock;
    uploadPhoto: jest.Mock;
    completeProfile: jest.Mock;
  };
  let controller: UserController;
  const user = { id: 1 } as UserEntity;

  beforeEach(() => {
    service = {
      buildResponseDto: jest.fn().mockResolvedValue({ id: 1 }),
      updateMe: jest.fn().mockResolvedValue({ id: 1 }),
      uploadPhoto: jest.fn().mockResolvedValue({ id: 1 }),
      completeProfile: jest.fn().mockResolvedValue({ id: 1 }),
    };
    controller = new UserController(service as unknown as UserService);
  });

  it('returns the current user profile', async () => {
    await controller.me(user);
    expect(service.buildResponseDto).toHaveBeenCalledWith(user);
  });

  it('updates the profile and re-serializes', async () => {
    await controller.updateMe(user, { firstName: 'Sara' } as never);
    expect(service.updateMe).toHaveBeenCalled();
    expect(service.buildResponseDto).toHaveBeenCalled();
  });

  it('uploads a photo and re-serializes', async () => {
    const file = { originalname: 'a.png' } as never;
    await controller.uploadPhoto(user, file);
    expect(service.uploadPhoto).toHaveBeenCalledWith(user, file);
  });

  it('completes the profile and re-serializes', async () => {
    await controller.completeProfile(user, { cityId: 1 } as never);
    expect(service.completeProfile).toHaveBeenCalledWith(user, { cityId: 1 });
  });
});
