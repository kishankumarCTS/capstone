import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { Public } from '@nestjs/authentication';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return {
      message: 'Refresh token endpoint',
      data: refreshTokenDto,
    };
  }

  @Post('logout')
  logout(@Body() refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
