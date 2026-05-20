import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';

import { CurrentUser } from 'core/decorators/current-user.decorator';
import { Protected } from 'core/decorators/protected.decorator';
import { Role } from 'domain/enums/role.enum';
import { MulterFile } from 'infrastructure/storage/http/multer.adapter';
import { ProcessedFile, UploadSingle } from 'infrastructure/storage/http';
import { UploadThrottle } from 'infrastructure/throttle';
import { AdminResponseDto } from '../dto/admin-response.dto';
import { UpdateMeDto } from '../dto/update-me.dto';
import { AdminEntity } from '../entities/admin.entity';
import { AdminService } from '../services/admin.service';

@Protected(Role.ADMIN)
@Controller({ path: 'admin/me', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async me(@CurrentUser() admin: AdminEntity): Promise<AdminResponseDto> {
    return this.adminService.buildResponseDto(admin);
  }

  @UploadThrottle()
  @Post('photo')
  @HttpCode(HttpStatus.OK)
  @UploadSingle('photo')
  async uploadPhoto(
    @CurrentUser() admin: AdminEntity,
    @ProcessedFile() file: MulterFile,
  ): Promise<AdminResponseDto> {
    const updated = await this.adminService.uploadPhoto(admin, file);
    return this.adminService.buildResponseDto(updated);
  }

  @Patch()
  async updateMe(
    @CurrentUser() admin: AdminEntity,
    @Body() dto: UpdateMeDto,
  ): Promise<AdminResponseDto> {
    const updated = await this.adminService.updateMe(admin, dto);
    return this.adminService.buildResponseDto(updated);
  }
}
