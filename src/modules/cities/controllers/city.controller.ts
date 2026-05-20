import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { Protected } from 'core/decorators/protected.decorator';
import { Role } from 'domain/enums/role.enum';
import { PositiveIntPipe } from 'core/pipes/positive-int.pipe';
import { CityResponseDto } from '../dto/city-response.dto';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { CityService } from '../services/city.service';

/**
 * City lookup endpoints. Public list/get for browsing, admin-only
 * create/update/delete for management.
 */
@Controller({ path: 'cities', version: '1' })
export class CityController {
  constructor(private readonly cityService: CityService) {}

  // ---------- Public (guest-accessible) ----------

  @Get()
  async findAll(): Promise<CityResponseDto[]> {
    const cities = await this.cityService.list();
    return cities.map(CityResponseDto.fromEntity);
  }

  @Get(':id')
  async findOne(@Param('id', PositiveIntPipe) id: number): Promise<CityResponseDto> {
    const city = await this.cityService.findByIdOrFail(id);
    return CityResponseDto.fromEntity(city);
  }

  // ---------- Admin ----------

  @Protected(Role.ADMIN)
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  async adminCreate(@Body() dto: CreateCityDto): Promise<CityResponseDto> {
    const city = await this.cityService.createForAdmin(dto);
    return CityResponseDto.fromEntity(city);
  }

  @Protected(Role.ADMIN)
  @Patch('admin/:id')
  async adminUpdate(
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateCityDto,
  ): Promise<CityResponseDto> {
    const city = await this.cityService.updateForAdmin(id, dto);
    return CityResponseDto.fromEntity(city);
  }

  @Protected(Role.ADMIN)
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminDelete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    await this.cityService.deleteForAdmin(id);
  }
}
