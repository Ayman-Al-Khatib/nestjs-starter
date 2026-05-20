import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesModule } from 'modules/cities/cities.module';
import { OtpsModule } from 'modules/otps/otps.module';
import { RefreshTokensModule } from 'modules/refresh-tokens/refresh-tokens.module';
import { AdminUserController } from './controllers/admin-user.controller';
import { UserAuthController } from './controllers/user-auth.controller';
import { UserController } from './controllers/user.controller';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserAuthService } from './services/user-auth.service';
import { UserService } from './services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    OtpsModule,
    CitiesModule,
    RefreshTokensModule,
  ],
  controllers: [UserAuthController, UserController, AdminUserController],
  providers: [UserRepository, UserService, UserAuthService],
  exports: [UserService],
})
export class UsersModule {}
