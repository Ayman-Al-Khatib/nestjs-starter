import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Translator } from 'infrastructure/i18n';

@Injectable()
export class PositiveIntPipe implements PipeTransform<string, number> {
  constructor(private readonly translator: Translator) {}

  transform(value: string): number {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(
        this.translator.tr('common.validation.id.integer', { property: 'id' }),
      );
    }
    if (parsed <= 0) {
      throw new BadRequestException(
        this.translator.tr('common.validation.id.positive', { property: 'id' }),
      );
    }
    return parsed;
  }
}
