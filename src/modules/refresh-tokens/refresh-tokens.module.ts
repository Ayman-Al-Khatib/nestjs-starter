import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppJwtModule } from 'infrastructure/jwt/app-jwt.module';
import { RefreshTokenController } from './controllers/refresh-token.controller';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity]), AppJwtModule],
  controllers: [RefreshTokenController],
  providers: [RefreshTokenRepository, RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokensModule {}
