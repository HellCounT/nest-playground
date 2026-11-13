import { JwtTokenService } from './jwt-token.service.js';
import { Module } from '@nestjs/common';

@Module({
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtModule {}
