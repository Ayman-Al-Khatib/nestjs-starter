import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';
import { CityService } from 'modules/cities/services/city.service';
import { Translator } from 'infrastructure/i18n';
import { CreateAreaDto } from '../dto/create-area.dto';
import { ListAreasQueryDto } from '../dto/list-areas-query.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { AreaEntity } from '../entities/area.entity';
import { AreaRepository } from '../repositories/area.repository';

/**
 * Public face of the Area module. Exposes list, get by id, and admin
 * mutators (create/update). Cross-module existence checks are also
 * provided for other modules that FK into areas.
 */
@Injectable()
export class AreaService {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly cityService: CityService,
    private readonly translator: Translator,
  ) {}

  list(query: ListAreasQueryDto): Promise<IPaginatedResponse<AreaEntity>> {
    return this.areaRepository.paginate(query);
  }

  async findByIdOrFail(id: number): Promise<AreaEntity> {
    const area = await this.areaRepository.findById(id);
    if (!area) {
      throw new NotFoundException(this.translator.tr('area.errors.not_found'));
    }
    return area;
  }

  /**
   * Cross-module guard: throws 404 with a localized message when the
   * given `areaId` is not in the lookup. Used by other services before
   * persisting an area reference so the FK violation never reaches the
   * database.
   */
  async assertExists(areaId: number): Promise<void> {
    const exists = await this.areaRepository.existsById(areaId);
    if (!exists) {
      throw new NotFoundException(this.translator.tr('area.errors.not_found'));
    }
  }

  /**
   * Cross-module guard: validates that the given area belongs to the
   * specified city. Throws 404 if area doesn't exist, 409 if it exists
   * but belongs to a different city. Returns the area entity on success.
   * This combines existence check and city validation in a single query.
   */
  async validateCityAndArea(areaId: number, cityId: number): Promise<AreaEntity> {
    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      throw new NotFoundException(this.translator.tr('area.errors.not_found'));
    }

    if (area.cityId !== cityId) {
      throw new ConflictException(this.translator.tr('area.errors.area_not_in_city'));
    }
    return area;
  }

  async createForAdmin(dto: CreateAreaDto): Promise<AreaEntity> {
    await this.cityService.assertExists(dto.cityId);

    // Check if nameEn already exists in this city
    const existingByNameEn = await this.areaRepository.findByCityAndNameEn(dto.cityId, dto.nameEn);
    if (existingByNameEn) {
      throw new ConflictException(this.translator.tr('area.errors.name_en_taken'));
    }

    // Check if nameAr already exists in this city
    const existingByNameAr = await this.areaRepository.findByCityAndNameAr(dto.cityId, dto.nameAr);
    if (existingByNameAr) {
      throw new ConflictException(this.translator.tr('area.errors.name_ar_taken'));
    }

    const area = this.areaRepository.create(dto);
    return this.areaRepository.save(area);
  }

  async updateForAdmin(id: number, dto: UpdateAreaDto): Promise<AreaEntity> {
    const area = await this.findByIdOrFail(id);

    // Determine the effective cityId (use new one if provided, otherwise keep current)
    const effectiveCityId = dto.cityId !== undefined ? dto.cityId : area.cityId;

    // Validate city exists if cityId is being changed
    if (dto.cityId !== undefined) {
      await this.cityService.assertExists(dto.cityId);
    }

    // Check if nameEn is being changed and if it conflicts
    if (dto.nameEn !== undefined && dto.nameEn !== area.nameEn) {
      const existingByNameEn = await this.areaRepository.findByCityAndNameEn(
        effectiveCityId,
        dto.nameEn,
      );
      if (existingByNameEn && existingByNameEn.id !== id) {
        throw new ConflictException(this.translator.tr('area.errors.name_en_taken'));
      }
    }

    // Check if nameAr is being changed and if it conflicts
    if (dto.nameAr !== undefined && dto.nameAr !== area.nameAr) {
      const existingByNameAr = await this.areaRepository.findByCityAndNameAr(
        effectiveCityId,
        dto.nameAr,
      );
      if (existingByNameAr && existingByNameAr.id !== id) {
        throw new ConflictException(this.translator.tr('area.errors.name_ar_taken'));
      }
    }

    return this.areaRepository.mergeAndSave(area, dto);
  }

  async deleteForAdmin(id: number): Promise<void> {
    const area = await this.findByIdOrFail(id);

    try {
      await this.areaRepository.deleteById(area.id);
    } catch (error: unknown) {
      // Translate a FK constraint violation (RESTRICT) into a domain conflict.
      const code = (error as { code?: string } | null)?.code;
      if (code === '23503') {
        throw new ConflictException(this.translator.tr('area.errors.cannot_delete_in_use'));
      }
      throw error;
    }
  }
}
