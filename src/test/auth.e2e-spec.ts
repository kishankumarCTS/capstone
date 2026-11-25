import { describe, it, expect, jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module.js';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { User } from 'src/users/entities/user.entities.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  RefreshToken,
  RefreshTokenStatus,
} from 'src/auth/entities/refresh-token.entity.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import {
  AuthenticationGuard,
  PasswordHasher,
  TokenService,
} from '@nestjs/authentication';
import { RefreshTokenService } from 'src/auth/refresh-token.service.js';
import { DeleteResult, FindOneOptions } from 'typeorm';
import { createHash } from 'crypto';

describe('authentication (e2e)', () => {
  let app: INestApplication<App>;

  const mockUserRepository = {
    findOne: jest.fn<(options: FindOneOptions<User>) => Promise<User | null>>(),
    findOneBy: jest.fn<() => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
    create: jest.fn<(user: Partial<User>) => User>(),
    update: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne:
      jest.fn<
        (options: FindOneOptions<RefreshToken>) => Promise<RefreshToken | null>
      >(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn<(criteria: any) => Promise<DeleteResult>>(),
  };

  const mockPasswordHasher = {
    verify: jest.fn<PasswordHasher['verify']>(),
    hash: jest.fn<PasswordHasher['hash']>(),
  };

  const mockTokenService = {
    issue: jest.fn(TokenService['issue']),
  };

  const mockRefreshTokenService = {
    freshRefreshToken: jest.fn<RefreshTokenService['freshRefreshToken']>(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(RefreshToken))
      .useValue(mockRefreshTokenRepository)
      .overrideProvider(PasswordHasher)
      .useValue(mockPasswordHasher)
      .overrideProvider(TokenService)
      .useValue(mockTokenService)
      .overrideProvider(RefreshTokenService)
      .useValue(mockRefreshTokenService)
      .overrideProvider(AuthenticationGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();
    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    app.useGlobalPipes(new ValidationPipe({}));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  const mockUserDetails = {
    email: 'test@email.com',
    password: 'test@password123',
    role: UserRoles.OWNER,
  } as User;
  const userId = 'user123';
  const hashedPassword = 'hashed-password';
  const mockToken = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
  const refreshTokenHash = createHash('sha256')
    .update(mockToken.refreshToken)
    .digest('hex');
  const mockRefreshDetails: RefreshToken = {
    id: 'refresh-token-123',
    familyId: 'family-123',
    status: RefreshTokenStatus.ACTIVE,
    createdAt: new Date('2026-11-17T10:00:00Z'),
    revokedAt: null,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + 3600000),
    user: { ...mockUserDetails, id: userId },
  };

  describe('POST /auth/register', () => {
    jest.clearAllMocks();
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...mockUserDetails,
        password: hashedPassword,
      });
      mockPasswordHasher.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserDetails,
        password: hashedPassword,
        id: userId,
      });
    });
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: mockUserDetails.email,
          password: mockUserDetails.password,
          role: mockUserDetails.role,
        });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUserDetails.email },
      });
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(
        mockUserDetails.password,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...mockUserDetails,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUserDetails,
        password: hashedPassword,
      });
      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });

    it('should throw an error when an invalid role is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: mockUserDetails.email,
          password: mockUserDetails.password,
          role: 'admin', // Invalid role
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    jest.clearAllMocks();
    beforeEach(() => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUserDetails,
        password: hashedPassword,
        id: userId,
      });
      mockPasswordHasher.verify.mockResolvedValue(true);
      mockTokenService.issue.mockResolvedValue(mockToken);
      mockRefreshTokenService.freshRefreshToken.mockResolvedValue(undefined);
    });
    it('should login an existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: mockUserDetails.email,
          password: mockUserDetails.password,
        });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: mockUserDetails.email,
        },
      });
      expect(mockPasswordHasher.verify).toHaveBeenCalledWith(
        mockUserDetails.password,
        hashedPassword,
      );
      expect(mockTokenService.issue).toHaveBeenCalledWith(userId, {
        method: 'password',
        claims: {
          amr: ['pwd'],
          email: mockUserDetails.email,
          role: mockUserDetails.role,
        },
      });
      expect(mockRefreshTokenService.freshRefreshToken).toHaveBeenCalledWith({
        refresh_token: mockToken.refreshToken,
        user_id: userId,
      });
      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /auth/refresh', () => {
    jest.clearAllMocks();
    beforeEach(() => {
      jest.clearAllMocks();
      mockRefreshTokenRepository.findOne.mockResolvedValue(mockRefreshDetails);
      mockTokenService.issue.mockResolvedValue(mockToken);
    });

    it('should return new tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer mock-access-token')
        .send({
          refreshToken: mockToken.refreshToken,
        });
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: mockRefreshDetails.refreshTokenHash,
        },
      });
      expect(mockTokenService.issue).toHaveBeenCalledWith(userId, {
        method: 'password',
        claims: {
          amr: ['pwd'],
          email: mockUserDetails.email,
          role: mockUserDetails.role,
        },
      });
      expect(response.status).toBe(201);
    });
  });

  describe('POST /auth/logout', () => {
    jest.clearAllMocks();
    const deletdResult = {
      raw: [],
      affected: 0,
    };
    beforeEach(() => {
      jest.clearAllMocks();
      mockRefreshTokenRepository.delete.mockResolvedValue(deletdResult);
    });
    it('should return delete message', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer mock-access-token')
        .send({
          refreshToken: mockToken.refreshToken,
        });
      expect(response.status).toBe(201);
      expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({
        refreshTokenHash: refreshTokenHash,
      });
    });
  });
});
