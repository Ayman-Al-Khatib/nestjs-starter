import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpEntity } from './entities/otp.entity';
import { OtpService } from './services/otp.service';
import { OtpRepository } from './repositories/otp.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OtpEntity])],
  providers: [OtpRepository, OtpService],
  exports: [OtpService],
})
export class OtpsModule {}
