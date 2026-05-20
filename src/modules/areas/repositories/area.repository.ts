import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';
import { paginate } from 'core/pagination/paginate.util';
import { DeepPartial, Repository } from 'typeorm';
import { ListAreasQueryDto } from '../dto/list-areas-query.dto';
import { AreaEntity } from '../entities/area.entity';

/**
 * Internal data-access layer for areas. Stays scoped to AreasModule —
 * external modules read the lookup through AreaService.
 */
@Injectable()
export class AreaRepository {
  constructor(
    @InjectRepository(AreaEntity)
    private readonly repo: Repository<AreaEntity>,
  ) {}

  findAll(): Promise<AreaEntity[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<AreaEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  existsById(id: number): Promise<boolean> {
    return this.repo.exists({ where: { id } });
  }

  paginate(query: ListAreasQueryDto): Promise<IPaginatedResponse<AreaEntity>> {
    const qb = this.repo.createQueryBuilder('area');

    if (query.search) {
      qb.andWhere('(area.name_en ILIKE :search OR area.name_ar ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.cityId !== undefined) {
      qb.andWhere('area.city_id = :cityId', { cityId: query.cityId });
    }

    qb.orderBy('area.id', 'ASC');

    return paginate(qb, query);
  }

  create(data: DeepPartial<AreaEntity>): AreaEntity {
    return this.repo.create(data);
  }

  save(area: AreaEntity): Promise<AreaEntity> {
    return this.repo.save(area);
  }

  mergeAndSave(entity: AreaEntity, changes: DeepPartial<AreaEntity>): Promise<AreaEntity> {
    this.repo.merge(entity, changes);
    return this.repo.save(entity);
  }

  findByCityAndNameEn(cityId: number, nameEn: string): Promise<AreaEntity | null> {
    return this.repo.findOne({ where: { cityId, nameEn } });
  }

  findByCityAndNameAr(cityId: number, nameAr: string): Promise<AreaEntity | null> {
    return this.repo.findOne({ where: { cityId, nameAr } });
  }

  async deleteById(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}
