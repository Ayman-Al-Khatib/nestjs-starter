import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from 'core/pagination/dto/pagination-query.dto';
import { Translator } from 'infrastructure/i18n';

export class ListAreasQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: Translator.trValMsg('common.validation.id.integer') })
  @Min(1, { message: Translator.trValMsg('common.validation.id.positive') })
  cityId?: number;
}
