import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Protected } from 'core/decorators/protected.decorator';
import { Role } from 'domain/enums/role.enum';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';
import { mapPaginatedAsync } from 'core/pagination/paginate.util';
import { PositiveIntPipe } from 'core/pipes/positive-int.pipe';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersAdminQueryDto } from '../dto/list-users-admin-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserService } from '../services/user.service';

@Protected(Role.ADMIN)
@Controller({ path: 'admin/users', version: '1' })
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Query() query: ListUsersAdminQueryDto,
  ): Promise<IPaginatedResponse<UserResponseDto>> {
    const result = await this.userService.findPageForAdmin(query);
    return mapPaginatedAsync(result, (user) => this.userService.buildResponseDto(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.createByAdmin(dto);
    return this.userService.buildResponseDto(user);
  }

  @Get(':id')
  async findOne(@Param('id', PositiveIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.userService.findByIdOrFail(id);
    return this.userService.buildResponseDto(user);
  }
}
