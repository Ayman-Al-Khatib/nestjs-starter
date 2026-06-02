import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Translator } from 'infrastructure/i18n';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { CityEntity } from '../entities/city.entity';
import { CityRepository } from '../repositories/city.repository';

/**
 * Public face of the City module. Exposes list, get by id, and admin
 * mutators (create/update/delete). Cross-module existence checks are
 * also provided for other modules that FK into cities.
 */
@Injectable()
export class CityService {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly translator: Translator,
  ) {}

  list(): Promise<CityEntity[]> {
    return this.cityRepository.findAll();
  }

  async findByIdOrFail(id: number): Promise<CityEntity> {
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new NotFoundException(this.translator.tr('city.errors.not_found'));
    }
    return city;
  }

  /**
   * Cross-module guard: throws 404 with a localized message when the
   * given `cityId` is not in the lookup. Used by other services before
   * persisting a city reference so the FK violation never reaches the
   * database.
   */
  async assertExists(cityId: number): Promise<void> {
    const exists = await this.cityRepository.existsById(cityId);
    if (!exists) {
      throw new NotFoundException(this.translator.tr('city.errors.not_found'));
    }
  }

  async createForAdmin(dto: CreateCityDto): Promise<CityEntity> {
    // Check if nameEn already exists
    const existingByNameEn = await this.cityRepository.findByNameEn(dto.nameEn);
    if (existingByNameEn) {
      throw new ConflictException(this.translator.tr('city.errors.name_en_taken'));
    }

    // Check if nameAr already exists
    const existingByNameAr = await this.cityRepository.findByNameAr(dto.nameAr);
    if (existingByNameAr) {
      throw new ConflictException(this.translator.tr('city.errors.name_ar_taken'));
    }

    const city = this.cityRepository.create(dto);
    return this.cityRepository.save(city);
  }

  async updateForAdmin(id: number, dto: UpdateCityDto): Promise<CityEntity> {
    const city = await this.findByIdOrFail(id);

    // Check if nameEn is being changed and if it conflicts
    if (dto.nameEn !== undefined && dto.nameEn !== city.nameEn) {
      const existingByNameEn = await this.cityRepository.findByNameEn(dto.nameEn);
      if (existingByNameEn && existingByNameEn.id !== id) {
        throw new ConflictException(this.translator.tr('city.errors.name_en_taken'));
      }
    }

    // Check if nameAr is being changed and if it conflicts
    if (dto.nameAr !== undefined && dto.nameAr !== city.nameAr) {
      const existingByNameAr = await this.cityRepository.findByNameAr(dto.nameAr);
      if (existingByNameAr && existingByNameAr.id !== id) {
        throw new ConflictException(this.translator.tr('city.errors.name_ar_taken'));
      }
    }

    return this.cityRepository.mergeAndSave(city, dto);
  }

  async deleteForAdmin(id: number): Promise<void> {
    const city = await this.findByIdOrFail(id);

    try {
      await this.cityRepository.deleteById(city.id);
    } catch (error: unknown) {
      // Translate a FK constraint violation into a domain conflict.
      // PostgreSQL: 23503, MySQL: ER_ROW_IS_REFERENCED
      const code = (error as { code?: string } | null)?.code;
      if (code === '23503' || code === 'ER_ROW_IS_REFERENCED') {
        throw new ConflictException(this.translator.tr('city.errors.cannot_delete_in_use'));
      }
      throw error;
    }
  }
}
