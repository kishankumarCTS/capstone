/* eslint-disable @typescript-eslint/unbound-method */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service.js';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from 'src/projects/entities/project.entity.js';
import { User } from 'src/users/entities/user.entities.js';
import { Comment } from './entities/comment.entity.js';
import { getQueueToken } from '@nestjs/bullmq';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockTaskRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: 'REDIS_CACHE',
          useValue: mockRedis,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {},
        },
        {
          provide: getQueueToken('task-assignment'),
          useValue: {
            add: jest.fn(),
            process: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    projectRepository = module.get(getRepositoryToken(Project));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const taskId = 'task123';
  const projectId = 'project123';
  const userId = 'user123';
  const mockTaskDetails = {
    id: taskId,
    description: 'task description',
    dueDate: new Date(),
    title: 'Task title',
    status: TaskStatus.TODO,
    createdAt: new Date(),
    priority: TaskPriority.LOW,
    updatedAt: new Date(),
    assignee: {
      id: userId,
    },
    project: {
      id: projectId,
    },
  } as Task;
  const mockProjectdetails = {
    id: projectId,
  } as Project;
  const mockUserdetails = {
    id: userId,
    role: UserRoles.OWNER,
  } as User;
  const createTaskDto = {
    title: mockTaskDetails.title,
    description: mockTaskDetails.description,
    status: mockTaskDetails.status,
    priority: mockTaskDetails.priority,
    dueDate: mockTaskDetails.dueDate,
    projectId: mockTaskDetails.project.id,
    assignee: mockTaskDetails.assignee?.id,
  };
  const updateTaskDto = {
    title: 'Upadted task',
  };

  const updatedTaskDetails = {
    ...mockTaskDetails,
    title: updateTaskDto.title,
  };

  describe('find_one', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      taskRepository.findOne.mockResolvedValue(mockTaskDetails);
    });

    it('should return Task', async () => {
      const result = await service.findOne(taskId);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
      });
      expect(result).toEqual(mockTaskDetails);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      projectRepository.findOne.mockResolvedValue(mockProjectdetails);
      userRepository.findOne.mockResolvedValue(mockUserdetails);
      taskRepository.create.mockReturnValue(mockTaskDetails);
      taskRepository.save.mockResolvedValue(mockTaskDetails);
    });
    it('should return task', async () => {
      const result = await service.create(createTaskDto);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: createTaskDto.projectId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: createTaskDto.assignee,
        },
      });
      expect(taskRepository.create).toHaveBeenCalledWith({
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status,
        priority: createTaskDto.priority,
        dueDate: createTaskDto.dueDate,
        project: mockProjectdetails,
        assignee: mockUserdetails,
      });
      expect(result).toEqual(mockTaskDetails);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      taskRepository.findOne.mockResolvedValue(mockTaskDetails);
      taskRepository.save.mockResolvedValue(updatedTaskDetails);
    });
    it('should return updated task', async () => {
      const result = await service.update(
        mockUserdetails,
        taskId,
        updateTaskDto,
      );
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(taskRepository.save).toHaveBeenCalledWith(updatedTaskDetails);
      expect(result).toEqual(updatedTaskDetails);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      taskRepository.findOne.mockResolvedValue(mockTaskDetails);
      taskRepository.remove.mockResolvedValue(mockTaskDetails);
    });

    it('should return delete message', async () => {
      const result = await service.remove(taskId);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
      });
      expect(taskRepository.remove).toHaveBeenCalledWith(mockTaskDetails);
      expect(result).toEqual({
        message: 'Task deleted',
      });
    });
  });
});
