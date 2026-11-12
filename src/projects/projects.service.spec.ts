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
    delete: jest.fn(),
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
});
