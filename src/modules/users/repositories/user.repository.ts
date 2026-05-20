import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';
import { paginate } from 'core/pagination/paginate.util';
import { DeepPartial, Repository } from 'typeorm';
import { ListUsersAdminQueryDto } from '../dto/list-users-admin-query.dto';
import { UserEntity } from '../entities/user.entity';

/**
 * Internal data-access for users. Stays scoped to UsersModule —
 * other modules that need user data go through UserService.
 */
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findById(id: number): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByPhone(phone: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { phone } });
  }

  create(data: DeepPartial<UserEntity>): UserEntity {
    return this.repo.create(data);
  }

  save(user: UserEntity): Promise<UserEntity> {
    return this.repo.save(user);
  }

  mergeAndSave(entity: UserEntity, changes: DeepPartial<UserEntity>): Promise<UserEntity> {
    this.repo.merge(entity, changes);
    return this.repo.save(entity);
  }

  findPageForAdmin(query: ListUsersAdminQueryDto): Promise<IPaginatedResponse<UserEntity>> {
    const qb = this.repo.createQueryBuilder('user');

    if (query.search) {
      const search = `%${query.search}%`;
      const condition = query.search.includes(' ')
        ? "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.phone ILIKE :search OR (COALESCE(user.first_name, '') || ' ' || COALESCE(user.last_name, '')) ILIKE :search)"
        : '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.phone ILIKE :search)';
      qb.andWhere(condition, { search });
    }
    if (query.isProfileCompleted !== undefined) {
      qb.andWhere('user.is_profile_completed = :isProfileCompleted', {
        isProfileCompleted: query.isProfileCompleted,
      });
    }

    qb.orderBy('user.id', 'DESC');
    return paginate(qb, query);
  }
}
