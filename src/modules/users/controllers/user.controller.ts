import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { CurrentUser } from 'core/decorators/current-user.decorator';
import { Protected } from 'core/decorators/protected.decorator';
import { Role } from 'domain/enums/role.enum';
import { MulterFile } from 'infrastructure/storage/http/multer.adapter';
import { ProcessedFile, UploadSingle } from 'infrastructure/storage/http';
import { UploadThrottle } from 'infrastructure/throttle';
import { CompleteUserProfileDto } from '../dto/complete-user-profile.dto';
import { UpdateUserMeDto } from '../dto/update-user-me.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../services/user.service';

/**
 * User self-profile. /user/me and /user/me/complete-profile are
 * intentionally exempt from @RequireCompletedProfile so a freshly
 * provisioned user can finish onboarding.
 */
@Protected(Role.USER)
@Controller({ path: 'user/me', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async me(@CurrentUser() user: UserEntity): Promise<UserResponseDto> {
    return this.userService.buildResponseDto(user);
  }

  @Patch()
  async updateMe(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateUserMeDto,
  ): Promise<UserResponseDto> {
    const updated = await this.userService.updateMe(user, dto);
    return this.userService.buildResponseDto(updated);
  }

  @UploadThrottle()
  @Post('photo')
  @HttpCode(HttpStatus.OK)
  @UploadSingle('photo')
  async uploadPhoto(
    @CurrentUser() user: UserEntity,
    @ProcessedFile() file: MulterFile,
  ): Promise<UserResponseDto> {
    const updated = await this.userService.uploadPhoto(user, file);
    return this.userService.buildResponseDto(updated);
  }

  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  async completeProfile(
    @CurrentUser() user: UserEntity,
    @Body() dto: CompleteUserProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.userService.completeProfile(user, dto);
    return this.userService.buildResponseDto(updated);
  }
}
