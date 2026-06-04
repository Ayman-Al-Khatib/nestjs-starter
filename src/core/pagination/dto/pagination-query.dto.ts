import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Translator } from 'infrastructure/i18n';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../pagination.constants';

/**
 * Standard query-string DTO for any paginated list endpoint. Extend it
 * to add filter / sort fields:
 *
 * @example
 *   export class ListUsersAdminQueryDto extends PaginationQueryDto {
 *     @IsOptional() isActive?: boolean;
 *   }
 *
 * Pass an instance directly to `paginate(qb, query)` — `PaginationQueryDto`
 * structurally satisfies `IPaginationOptions`.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: Translator.trValMsg('common.validation.number.invalid') })
  @Min(1, { message: Translator.trValMsg('common.validation.number.too_small') })
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: Translator.trValMsg('common.validation.number.invalid') })
  @Min(1, { message: Translator.trValMsg('common.validation.number.too_small') })
  @Max(MAX_LIMIT, { message: Translator.trValMsg('common.validation.number.too_large') })
  limit?: number = DEFAULT_LIMIT;
}
