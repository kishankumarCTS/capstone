import { jest } from '@jest/globals';
import { TokenService } from '@nestjs/authentication';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module.js';
import {
  Task,
  TaskPriority,
  TaskStatus,
} from 'src/tasks/entities/task.entity.js';
import { App } from 'supertest/types.js';
import { FindOneOptions } from 'typeorm';
import { generateTestToken } from './helpers/auth.helper.js';
import { User } from 'src/users/entities/user.entities.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import request from 'supertest';
import { Project } from 'src/projects/entities/project.entity.js';

describe('Task', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const mockTaskRepository = {
    create: jest.fn<(task: Partial<Task>) => Task>(),
    save: jest.fn<(task: Task) => Promise<Task>>(),
    update: jest.fn(),
    findOne: jest.fn<(options: FindOneOptions<Task>) => Promise<Task | null>>(),
    find: jest.fn<(options: FindOneOptions<Task>) => Promise<Task[] | []>>(),
    remove: jest.fn<(criteria: any) => Promise<Task>>(),
  };
  const mockUserRepository = {
    findOne: jest.fn<(options: FindOneOptions<User>) => Promise<User | null>>(),
  };
  const mockProjectRepository = {
    findOne:
      jest.fn<(options: FindOneOptions<Project>) => Promise<Project | null>>(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Task))
      .useValue(mockTaskRepository)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(Project))
      .useValue(mockProjectRepository)
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

  const taskId = 'task123';
  const userId = '7f3a9c2e-8b41-4d6f-a725-1c9e0b53d842';
  const projectId = 'project123';
  const mockProjectDetails = {
    id: projectId,
  } as Project;
  const mockUserDetails = {
    id: userId,
    email: 'test@email.com',
    password: 'test@password123',
    role: UserRoles.OWNER,
  } as User;
  const mockTaskDetails = {
    id: taskId,
    title: 'Task title',
    description: 'Task description',
    dueDate: new Date(),
    priority: TaskPriority.LOW,
    status: TaskStatus.TODO,
    project: mockProjectDetails,
    assignee: mockUserDetails,
  } as Task;

  describe('GET /tasks/:id', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockTaskRepository.findOne.mockResolvedValue(mockTaskDetails);
    });
    it('should return task', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .get(`/tasks/${mockTaskDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /tasks', () => {
    beforeEach(() => {
      mockProjectRepository.findOne.mockResolvedValue(mockProjectDetails);
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockTaskRepository.create.mockReturnValue(mockTaskDetails);
      mockTaskRepository.save.mockResolvedValue(mockTaskDetails);
    });

    it('should create and return task', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: mockTaskDetails.title,
          description: mockTaskDetails.description,
          status: mockTaskDetails.status,
          priority: mockTaskDetails.priority,
          dueDate: mockTaskDetails.dueDate,
          projectId: projectId,
          assignee: userId,
        });
      expect(response.status).toBe(201);
    });
  });

  describe('PATCH /tasks/:id', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockTaskRepository.findOne.mockResolvedValue(mockTaskDetails);
    });

    it('Should return updated task', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${mockTaskDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Tast Title',
        });
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /tasks/:id', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue(mockUserDetails);
      mockTaskRepository.findOne.mockResolvedValue(mockTaskDetails);
      mockTaskRepository.remove.mockResolvedValue(mockTaskDetails);
    });
    it('Should delete task.', async () => {
      const { accessToken } = await generateTestToken(
        tokenService,
        mockUserDetails,
      );
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${mockTaskDetails.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
    });
  });
});
