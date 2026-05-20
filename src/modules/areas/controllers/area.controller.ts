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
    Query,
} from '@nestjs/common';
import { Protected } from 'core/decorators/protected.decorator';
import { Role } from 'domain/enums/role.enum';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';
import { mapPaginated } from 'core/pagination/paginate.util';
import { PositiveIntPipe } from 'core/pipes/positive-int.pipe';
import { AreaResponseDto } from '../dto/area-response.dto';
import { CreateAreaDto } from '../dto/create-area.dto';
import { ListAreasQueryDto } from '../dto/list-areas-query.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { AreaService } from '../services/area.service';

/**
 * Area lookup endpoints. Public list/get for browsing, admin-only
 * create/update for management.
 */
@Controller({ path: 'areas', version: '1' })
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  // ---------- Public (guest-accessible) ----------

  @Get()
  async findAll(@Query() query: ListAreasQueryDto): Promise<IPaginatedResponse<AreaResponseDto>> {
    const result = await this.areaService.list(query);
    return mapPaginated(result, AreaResponseDto.fromEntity);
  }

  @Get(':id')
  async findOne(@Param('id', PositiveIntPipe) id: number): Promise<AreaResponseDto> {
    const area = await this.areaService.findByIdOrFail(id);
    return AreaResponseDto.fromEntity(area);
  }

  // ---------- Admin ----------

  @Protected(Role.ADMIN)
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  async adminCreate(@Body() dto: CreateAreaDto): Promise<AreaResponseDto> {
    const area = await this.areaService.createForAdmin(dto);
    return AreaResponseDto.fromEntity(area);
  }

  @Protected(Role.ADMIN)
  @Patch('admin/:id')
  async adminUpdate(
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    const area = await this.areaService.updateForAdmin(id, dto);
    return AreaResponseDto.fromEntity(area);
  }

  @Protected(Role.ADMIN)
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminDelete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    await this.areaService.deleteForAdmin(id);
  }
}
