/* eslint-disable @typescript-eslint/unbound-method */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entities.js';
import {
  RefreshToken,
  RefreshTokenStatus,
} from './entities/refresh-token.entity.js';
import {
  PasswordHasher,
  TokenPair,
  TokenService,
} from '@nestjs/authentication';
import { RefreshTokenService } from './refresh-token.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { RegisterDto } from './dto/register.dto.js';
import { createHash } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let tokenService: jest.Mocked<TokenService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockPasswordHasher = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const mockTokenService = {
    issue: jest.fn(),
  };

  const mockRefreshTokenService = {
    freshRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: PasswordHasher,
          useValue: mockPasswordHasher,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    passwordHasher = module.get(PasswordHasher);
    tokenService = module.get(TokenService);
    refreshTokenService = module.get(RefreshTokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'StrongPassword123!',
    };

    const mockUser = {
      id: 'abc123',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'owner',
      createdAt: new Date(),
    } as User;

    it('should successfully login and return tokens', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(true);
      console.log(refreshTokenRepository);
      const tokenResponse = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      } as TokenPair;
      tokenService.issue.mockResolvedValue(tokenResponse);
      refreshTokenService.freshRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });

      expect(passwordHasher.verify).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(tokenService.issue).toHaveBeenCalledWith(mockUser.id, {
        method: 'password',
        claims: { amr: ['pwd'], email: mockUser.email, role: mockUser.role },
      });
      expect(refreshTokenService.freshRefreshToken).toHaveBeenCalledWith({
        refresh_token: 'refresh_token',
        user_id: mockUser.id,
      });
      expect(result).toEqual(tokenResponse);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@email.com',
      password: 'test_password',
      role: 'owner',
    } as RegisterDto;
    const mockUser = {
      id: 'abc123',
      email: registerDto.email,
      password: 'hashed_password',
      role: registerDto.role,
      createdAt: new Date(),
    } as User;
    beforeEach(() => {
      userRepository.findOne.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed_password');
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
    });

    it('should return success message', async () => {
      const result = await service.register(registerDto);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(passwordHasher.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashed_password',
        role: registerDto.role,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        message: 'User created',
        user_id: 'abc123',
      });
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-token';
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');
    const mockTokenDetails = {
      refreshTokenHash: hashedToken,
      status: RefreshTokenStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user: {
        id: 'user-id',
        email: 'test@example.com',
        role: 'owner',
      },
    } as RefreshToken;
    const mockToken = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    } as TokenPair;
    beforeEach(() => {
      refreshTokenRepository.findOne.mockResolvedValue(mockTokenDetails);
      tokenService.issue.mockResolvedValue(mockToken);
    });
    it('should return token pair', async () => {
      const result = await service.refresh(refreshToken);
      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: hashedToken,
        },
      });
      expect(tokenService.issue).toHaveBeenCalledWith(
        mockTokenDetails.user.id,
        {
          method: 'password',
          claims: {
            amr: ['pwd'],
            email: mockTokenDetails.user.email,
            role: mockTokenDetails.user.role,
          },
        },
      );
      expect(result).toEqual(mockToken);
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid_refresh_token';
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');
    beforeEach(() => {
      refreshTokenRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });
    });
    it('should return logout message', async () => {
      const result = await service.logout(refreshToken);
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        refreshTokenHash: hashedToken,
      });
      expect(result).toEqual('User logged out.');
    });
  });
});
