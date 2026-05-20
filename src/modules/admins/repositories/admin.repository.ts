import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AdminEntity } from '../entities/admin.entity';

/**
 * Internal data-access layer for admins. Stays scoped to AdminsModule —
 * no other module imports this class. Anything other modules need from
 * the admin domain is exposed via AdminService.
 */
@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly repo: Repository<AdminEntity>,
  ) {}

  findById(id: number): Promise<AdminEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByUsername(username: string): Promise<AdminEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  save(admin: AdminEntity): Promise<AdminEntity> {
    return this.repo.save(admin);
  }

  mergeAndSave(entity: AdminEntity, changes: DeepPartial<AdminEntity>): Promise<AdminEntity> {
    this.repo.merge(entity, changes);
    return this.repo.save(entity);
  }


}
