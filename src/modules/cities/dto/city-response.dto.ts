import { CityEntity } from '../entities/city.entity';

/**
 * Public-facing shape of a city. Built explicitly from CityEntity so
 * adding new columns does not silently leak them into responses.
 */
export class CityResponseDto {
  id: number;
  nameEn: string;
  nameAr: string;

  static fromEntity(city: CityEntity): CityResponseDto {
    const dto = new CityResponseDto();
    dto.id = city.id;
    dto.nameEn = city.nameEn;
    dto.nameAr = city.nameAr;
    return dto;
  }
}
