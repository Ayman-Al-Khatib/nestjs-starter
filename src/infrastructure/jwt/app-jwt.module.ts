import { Global, Module } from '@nestjs/common';
import { AppJwtService } from './app-jwt.service';

@Global()
@Module({
  exports: [AppJwtService],
  providers: [AppJwtService],
})
export class AppJwtModule {}
