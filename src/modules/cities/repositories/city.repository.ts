import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { CityEntity } from '../entities/city.entity';

/**
 * Internal data-access layer for cities. Stays scoped to CitiesModule —
 * external modules read the lookup through CityService.
 */
@Injectable()
export class CityRepository {
  constructor(
    @InjectRepository(CityEntity)
    private readonly repo: Repository<CityEntity>,
  ) {}

  findAll(): Promise<CityEntity[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<CityEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  existsById(id: number): Promise<boolean> {
    return this.repo.exists({ where: { id } });
  }

  findByNameEn(nameEn: string): Promise<CityEntity | null> {
    return this.repo.findOne({ where: { nameEn } });
  }

  findByNameAr(nameAr: string): Promise<CityEntity | null> {
    return this.repo.findOne({ where: { nameAr } });
  }

  create(dto: CreateCityDto): CityEntity {
    return this.repo.create(dto);
  }

  save(city: CityEntity): Promise<CityEntity> {
    return this.repo.save(city);
  }

  mergeAndSave(city: CityEntity, dto: UpdateCityDto): Promise<CityEntity> {
    this.repo.merge(city, dto);
    return this.repo.save(city);
  }

  async deleteById(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
