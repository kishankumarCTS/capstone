import { describe, jest, it, expect } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module.js';
import { Project } from 'src/projects/entities/project.entity.js';
import { App } from 'supertest/types.js';
import request from 'supertest';
import { generateTestToken } from './helpers/auth.helper.js';
import { TokenService } from '@nestjs/authentication';
import { User } from 'src/users/entities/user.entities.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { DeleteResult, FindOneOptions } from 'typeorm';

describe('Project e2e', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const mockProjectRepository = {
    create: jest.fn<(project: Partial<Project>) => Project>(),
    save: jest.fn<(project: Project) => Promise<Project>>(),
    findOne:
      jest.fn<(options: FindOneOptions<Project>) => Promise<Project | null>>(),
    delete: jest.fn<(criteria: any) => Promise<DeleteResult>>(),
  };
  const mockUserRepository = {
    findOne: jest.fn<(options: FindOneOptions<User>) => Promise<User | null>>(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Project))
      .useValue(mockProjectRepository)
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
  const mockProjectDetails = {
    id: 'project123',
    name: 'Project name',
    createdAt: new Date(),
    workspace: {
      id: 'workspace123',
      owner: mockUserDetails,
    },
  } as Project;

  describe('GET /project/:project_id', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockProjectRepository.findOne.mockResolvedValue(mockProjectDetails);
    });
    it('should return Project', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .get(`/projects/${mockProjectDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('POST /projects', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockProjectRepository.create.mockReturnValue(mockProjectDetails);
      mockProjectRepository.save.mockResolvedValue(mockProjectDetails);
    });

    it('should create a project', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: mockProjectDetails.name,
          workspaceId: mockProjectDetails.workspace.id,
        });
      expect(response.status).toBe(201);
    });
  });

  describe('PATCH /projects/:id', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockProjectRepository.findOne.mockResolvedValue(mockProjectDetails);
      mockProjectRepository.save.mockResolvedValue({
        ...mockProjectDetails,
        name: 'Updated project',
      });
    });

    it('should update a project', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .patch(`/projects/${mockProjectDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated project',
        });
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /projects/:project_id', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockProjectRepository.findOne.mockResolvedValue(mockProjectDetails);
      mockProjectRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });
    });

    it('should delete a project', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );

      const response = await request(app.getHttpServer())
        .delete(`/projects/${mockProjectDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
    });
  });
});
