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

  const userId = 'user123';
  const mockProjectDetails = {
    id: 'project123',
    name: 'Project Name',
    workspace: {
      id: 'workspace123',
    },
    createdAt: new Date(),
  } as Project;
  const projectResponse = {
    name: mockProjectDetails.name,
    workspace: mockProjectDetails.workspace.id,
  };

  describe('create', () => {
    beforeEach(() => {
      projectRepository.create.mockReturnValue(mockProjectDetails);
      projectRepository.save.mockResolvedValue(mockProjectDetails);
    });
    it('should reurn project object', async () => {
      const result = await service.create({
        name: mockProjectDetails.name,
        workspaceId: mockProjectDetails.workspace.id,
      });
      expect(projectRepository.create).toHaveBeenCalledWith({
        name: mockProjectDetails.name,
        workspace: {
          id: mockProjectDetails.workspace.id,
        },
      });
      expect(projectRepository.save).toHaveBeenCalledWith(mockProjectDetails);
      expect(result).toEqual({ ...projectResponse, id: mockProjectDetails.id });
    });
  });

  describe('find_one', () => {
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue(mockProjectDetails);
    });
    it('should return project object', async () => {
      const result = await service.findOne(userId, mockProjectDetails.id);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockProjectDetails.id,
          workspace: {
            owner: {
              id: userId,
            },
          },
        },
      });
      expect(result).toEqual({
        id: mockProjectDetails.id,
        name: mockProjectDetails.name,
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue(mockProjectDetails);
      projectRepository.save.mockResolvedValue({
        ...mockProjectDetails,
        name: 'Updated project',
      });
    });
    it('should return', async () => {
      const result = await service.update(userId, mockProjectDetails.id, {
        name: 'Updated project',
      });
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockProjectDetails.id,
          workspace: {
            owner: {
              id: userId,
            },
          },
        },
      });
      expect(projectRepository.save).toHaveBeenCalledWith({
        ...mockProjectDetails,
        name: 'Updated project',
      });
      expect(result).toEqual({
        ...mockProjectDetails,
        name: 'Updated project',
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue(mockProjectDetails);
      projectRepository.delete.mockResolvedValue({
        raw: [],
        affected: 1,
      });
    });
    it('should return delete message', async () => {
      const result = await service.remove(userId, mockProjectDetails.id);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockProjectDetails.id,
          workspace: {
            owner: {
              id: userId,
            },
          },
        },
      });
      expect(mockProjectRepository.delete).toHaveBeenCalledWith(
        mockProjectDetails.id,
      );
      expect(result).toEqual({
        message: 'Project removed.',
      });
    });
  });
});
