import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokensModule } from 'modules/refresh-tokens/refresh-tokens.module';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminController } from './controllers/admin.controller';
import { AdminEntity } from './entities/admin.entity';
import { AdminRepository } from './repositories/admin.repository';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminService } from './services/admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity]), RefreshTokensModule],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminRepository, AdminService, AdminAuthService],
  exports: [AdminService],
})
export class AdminsModule {}
