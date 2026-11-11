import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entities.js';
import { RefreshTokenService } from './refresh-token.service.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { JwtAuth } from './jwt-auth.provider.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken])],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, JwtAuth],
})
export class AuthModule {}
