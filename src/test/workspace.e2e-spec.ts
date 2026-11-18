import { describe, it, expect, jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from 'src/app.module.js';
import { Workspace } from 'src/workspaces/entities/workspace.entity.js';
import { App } from 'supertest/types.js';
import { DeleteResult, FindOneOptions } from 'typeorm';
import { User } from 'src/users/entities/user.entities.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { TokenService } from '@nestjs/authentication';
import { generateTestToken } from './helpers/auth.helper.js';

describe('workspace e2e', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const mockWorkspaceRepository = {
    create: jest.fn<(workspace: Partial<Workspace>) => Workspace>(),
    save: jest.fn<(workspace: Workspace) => Promise<Workspace>>(),
    update: jest.fn(),
    findOne:
      jest.fn<
        (options: FindOneOptions<Workspace>) => Promise<Workspace | null>
      >(),
    find: jest.fn<
      (options: FindOneOptions<Workspace>) => Promise<Workspace[] | []>
    >(),
    delete: jest.fn<(criteria: any) => Promise<DeleteResult>>(),
  };
  const mockUserRepository = {
    findOne: jest.fn<(options: FindOneOptions<User>) => Promise<User | null>>(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Workspace))
      .useValue(mockWorkspaceRepository)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();
    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    app.useGlobalPipes(new ValidationPipe({}));
    tokenService = moduleFixture.get(TokenService);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  const userId = '7f3a9c2e-8b41-4d65-a027-91e6c5b84f32';
  const mockUserDetails = {
    id: userId,
    email: 'test@email.com',
    password: 'test@password123',
    role: UserRoles.OWNER,
  } as User;
  const mockWorkspaceDetails = {
    id: 'workspace123',
    createdAt: new Date(),
    name: 'Workspace 123',
    owner: mockUserDetails,
  } as Workspace;

  describe('POST /workspaces', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockWorkspaceRepository.create.mockReturnValue(mockWorkspaceDetails);
      mockWorkspaceRepository.save.mockResolvedValue(mockWorkspaceDetails);
    });
    it('should return created workspace', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .post('/workspaces')
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({
          name: mockWorkspaceDetails.name,
        });
      expect(mockWorkspaceRepository.create).toHaveBeenCalledWith({
        name: mockWorkspaceDetails.name,
        owner: mockUserDetails,
      });
      expect(mockWorkspaceRepository.save).toHaveBeenCalledWith(
        mockWorkspaceDetails,
      );
      expect(response.status).toBe(201);
    });
  });

  describe('GET /workspaces/:id', () => {
    beforeEach(() => {
      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspaceDetails);
    });

    it('should return workspace', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .get(`/workspaces/${mockWorkspaceDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /workspaces/:id', () => {
    beforeEach(() => {
      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspaceDetails);
    });

    it('should return all workspaces', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .patch(`/workspaces/${mockWorkspaceDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'updated workspace' });
      expect(mockWorkspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockWorkspaceDetails.id,
          owner: {
            id: userId,
          },
        },
        relations: {
          owner: true,
        },
      });
      expect(response.status).toBe(200);
    });
  });

  describe('delete /workspaces/:id', () => {
    beforeEach(() => {
      mockWorkspaceRepository.findOne.mockResolvedValue(mockWorkspaceDetails);
      mockWorkspaceRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });
    });

    it('should delete workspace', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .delete(`/workspaces/${mockWorkspaceDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(mockWorkspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockWorkspaceDetails.id,
          owner: {
            id: userId,
          },
        },
      });
      expect(response.status).toBe(200);
    });
  });
});
