import { INestApplication } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from '../app.module';

export function enableClassValidatorDI(app: INestApplication): void {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
}
