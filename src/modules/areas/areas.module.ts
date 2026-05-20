import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesModule } from 'modules/cities/cities.module';
import { AreaController } from './controllers/area.controller';
import { AreaEntity } from './entities/area.entity';
import { AreaRepository } from './repositories/area.repository';
import { AreaService } from './services/area.service';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity]), CitiesModule],
  controllers: [AreaController],
  providers: [AreaRepository, AreaService],
  exports: [AreaService],
})
export class AreasModule {}
