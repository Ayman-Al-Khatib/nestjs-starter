import { AreaEntity } from '../entities/area.entity';

/**
 * Public-facing shape of an area. Built explicitly from AreaEntity so
 * adding new columns does not silently leak them into responses.
 */
export class AreaResponseDto {
  id: number;
  cityId: number;
  nameEn: string;
  nameAr: string;

  static fromEntity(area: AreaEntity): AreaResponseDto {
    const dto = new AreaResponseDto();
    dto.id = area.id;
    dto.cityId = area.cityId;
    dto.nameEn = area.nameEn;
    dto.nameAr = area.nameAr;
    return dto;
  }
}
