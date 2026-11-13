/* eslint-disable @typescript-eslint/unbound-method */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service.js';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: jest.Mocked<Repository<Project>>;

  const mockProjectRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: 'REDIS_CACHE',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepository = module.get(getRepositoryToken(Project));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto = {
      name: 'project 123',
      workspaceId: 'abc123',
    };
    const mockProjectValues = {
      id: 'project123',
      name: createProjectDto.name,
      workspace: {
        id: createProjectDto.workspaceId,
      },
      createdAt: new Date(),
    } as Project;
    const projectResponse = {
      id: mockProjectValues.id,
      name: createProjectDto.name,
      workspace: createProjectDto.workspaceId,
    };
    beforeEach(() => {
      projectRepository.create.mockReturnValue(mockProjectValues);
      projectRepository.save.mockResolvedValue(mockProjectValues);
    });
    it('should reurn project object', async () => {
      const result = await service.create(createProjectDto);
      expect(projectRepository.create).toHaveBeenCalledWith({
        name: createProjectDto.name,
        workspace: {
          id: createProjectDto.workspaceId,
        },
      });
      expect(projectRepository.save).toHaveBeenCalledWith(mockProjectValues);
      expect(result).toEqual(projectResponse);
    });
  });

  describe('find_one', () => {
    const userId = 'xyz123';
    const mockProjectValues = {
      id: 'project123',
      name: 'project name',
      workspace: {
        id: 'abc123',
      },
      createdAt: new Date(),
    } as Project;
    const projectResponse = {
      id: mockProjectValues.id,
      name: mockProjectValues.name,
    };
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue(mockProjectValues);
    });
    it('should return project object', async () => {
      const result = await service.findOne(userId, mockProjectValues.id);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockProjectValues.id,
          workspace: {
            owner: {
              id: userId,
            },
          },
        },
      });
      expect(result).toEqual(projectResponse);
    });
  });

  describe('update', () => {
    const userId = 'xyz123';
    const updateProjectDto = {
      name: 'project name updated',
    };
    const mockProjectValues = {
      id: 'project123',
      name: 'project name',
      workspace: {
        id: 'abc123',
      },
      createdAt: new Date(),
    } as Project;
    const mockUpdatedProjectValues = {
      id: mockProjectValues.id,
      name: updateProjectDto.name,
      workspace: {
        id: mockProjectValues.workspace.id,
      },
      createdAt: new Date(),
    } as Project;
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue(mockProjectValues);
      projectRepository.save.mockResolvedValue(mockUpdatedProjectValues);
    });
    it('should return', async () => {
      const result = await service.update(
        userId,
        mockProjectValues.id,
        updateProjectDto,
      );
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockProjectValues.id,
          workspace: {
            owner: {
              id: userId,
            },
          },
        },
      });
      expect(projectRepository.save).toHaveBeenCalledWith(
        mockUpdatedProjectValues,
      );
      expect(result).toEqual(mockUpdatedProjectValues);
    });
  });

  describe('remove', () => {
    const userId = 'user123';
    const projectId = 'project123';
    const mockProjectValues = {
      id: projectId,
      name: 'project name',
      workspace: {
        id: 'abc123',
      },
      createdAt: new Date(),
    } as Project;
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue(mockProjectValues);
      projectRepository.remove.mockResolvedValue(mockProjectValues);
    });
    it('should return delete message', async () => {
      const result = await service.remove(userId, projectId);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: projectId,
          workspace: {
            owner: {
              id: userId,
            },
          },
        },
      });
      expect(projectRepository.remove).toHaveBeenCalledWith(mockProjectValues);
      expect(result).toEqual({
        message: 'Project removed.',
      });
    });
  });
});
