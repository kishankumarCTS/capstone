import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/register.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entities.js';
import { Repository } from 'typeorm';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { RefreshTokenService } from './refresh-token.service.js';
import {
  RefreshToken,
  RefreshTokenStatus,
} from './entities/refresh-token.entity.js';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}
  async register(registerDto: RegisterDto) {
    const { email, password, role } = registerDto;
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (user) {
      throw new ConflictException('User already exists.');
    }

    const hashedPassword = await this.passwordHasher.hash(password);
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      role,
    });
    const savedUser = await this.userRepository.save(newUser);
    return { message: 'User created', user_id: savedUser.id };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Email or password was incorrect.');
    }
    const isValid = await this.passwordHasher.verify(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Email or password was incorrect.');
    }
    const token = await this.tokenService.issue(user.id, {
      method: 'password',
      claims: { amr: ['pwd'], email: user.email, role: user.role },
    });

    await this.refreshTokenService.freshRefreshToken({
      refresh_token: token.refreshToken,
      user_id: user.id,
    });

    return token;
  }

  async refresh(refreshToken: string) {
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');
    const tokenDetails = await this.refreshTokenRepository.findOne({
      where: {
        refreshTokenHash: hashedToken,
      },
    });
    if (!tokenDetails) {
      throw new UnauthorizedException('Inavlid refresh token');
    }
    if (tokenDetails.status === RefreshTokenStatus.REVOKED) {
      await this.refreshTokenRepository.delete({
        familyId: tokenDetails.familyId,
      });
      throw new UnauthorizedException(
        'You are not authorized. Please login again.',
      );
    }
    if (tokenDetails.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'Refresh token expired. Please login again.',
      );
    }
    const token = await this.tokenService.issue(tokenDetails.user.id, {
      method: 'password',
      claims: {
        amr: ['pwd'],
        email: tokenDetails.user.email,
        role: tokenDetails.user.role,
      },
    });
    return token;
  }

  async logout(refreshToken: string) {
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');
    await this.refreshTokenRepository.delete({
      refreshTokenHash: hashedToken,
    });
    return 'User logged out.';
  }
}
