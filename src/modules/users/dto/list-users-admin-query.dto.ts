import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BooleanField } from 'core/decorators/boolean-field.decorator';
import { SkipIfUndefined } from 'core/decorators/skip-if-undefined.decorator';
import { PaginationQueryDto } from 'core/pagination/dto/pagination-query.dto';
import { Translator } from 'infrastructure/i18n';

export class ListUsersAdminQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MaxLength(200, { message: Translator.trValMsg('common.validation.string.too_long') })
  search?: string;

  @SkipIfUndefined()
  @BooleanField()
  isProfileCompleted?: boolean;
}
