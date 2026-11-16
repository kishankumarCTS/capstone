import { describe, it, expect, jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module.js';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { User } from 'src/users/entities/user.entities.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';

describe('authentication (e2e)', () => {
  let app: INestApplication<App>;

  const mockUserRepository = {
    findOne: jest.fn<() => Promise<User | null>>(),
    findOneBy: jest.fn<() => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
    create: jest.fn<(user: Partial<User>) => User>(),
    update: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(RefreshToken))
      .useValue(mockRefreshTokenRepository)
      .compile();
    app = moduleFixture.createNestApplication();
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
    id: 'user123',
  } as User;

  describe('POST /auth/register', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUserDetails);
      mockUserRepository.save.mockResolvedValue(mockUserDetails);
    });
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: mockUserDetails.email,
          password: mockUserDetails.password,
          role: mockUserDetails.role,
        });
      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });
  });
});
