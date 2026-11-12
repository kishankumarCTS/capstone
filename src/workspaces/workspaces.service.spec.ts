/* eslint-disable @typescript-eslint/unbound-method */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service.js';
import { Workspace } from './entities/workspace.entity.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let workspaceRepository: jest.Mocked<Repository<Workspace>>;

  const mockWorkspaceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepository,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    workspaceRepository = module.get(getRepositoryToken(Workspace));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createWorkspaceDto = {
      name: 'test_workspace',
    };
    const mockWorkspace = {
      id: 'abc123',
      name: createWorkspaceDto.name,
      owner: {
        id: 'user123',
      },
      createdAt: new Date(),
    } as Workspace;

    const mockWorkspaceResponse = {
      id: mockWorkspace.id,
      name: mockWorkspace.name,
      owner: mockWorkspace.owner.id,
      createdAt: mockWorkspace.createdAt,
    };

    beforeEach(() => {
      workspaceRepository.create.mockReturnValue(mockWorkspace);
      workspaceRepository.save.mockResolvedValue(mockWorkspace);
    });

    it('should return workspace object', async () => {
      const result = await service.create(
        mockWorkspace.owner.id,
        createWorkspaceDto,
      );
      expect(workspaceRepository.create).toHaveBeenCalledWith({
        name: mockWorkspace.name,
        owner: {
          id: mockWorkspace.owner.id,
        },
      });
      expect(workspaceRepository.save).toHaveBeenCalledWith(mockWorkspace);
      expect(result).toEqual(mockWorkspaceResponse);
    });
  });

  describe('find_one', () => {
    const findOneDto = {
      userId: 'abc123',
      id: 'xyz123',
    };
    const mockWorkspace = {
      id: findOneDto.id,
      name: 'workspace_name',
      owner: {
        id: findOneDto.userId,
      },
      createdAt: new Date(),
    } as Workspace;
    const mockWorkspaceResponse = {
      id: findOneDto.id,
      name: mockWorkspace.name,
      owner: mockWorkspace.owner.id,
      createdAt: mockWorkspace.createdAt,
    };

    beforeEach(() => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspace);
    });

    it('should return workspace object', async () => {
      const result = await service.findOne(findOneDto.userId, findOneDto.id);
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: findOneDto.id,
          owner: {
            id: findOneDto.userId,
          },
        },
        relations: {
          owner: true,
        },
      });
      expect(result).toEqual(mockWorkspaceResponse);
    });
  });

  describe('update', () => {
    const userId = 'xyz123';
    const updateWorkspaceDto = {
      name: 'updated workspce name',
    };
    const mockWorkspace = {
      id: 'abc123',
      name: 'workspace_name',
      owner: {
        id: userId,
      },
      createdAt: new Date(),
    } as Workspace;
    const mockUpdatedWorkspace = {
      id: 'abc123',
      name: updateWorkspaceDto.name,
      owner: {
        id: userId,
      },
      createdAt: new Date(),
    } as Workspace;
    const mockWorkspaceResponse = {
      id: mockWorkspace.id,
      name: updateWorkspaceDto.name,
      owner: mockWorkspace.owner.id,
      createdAt: mockWorkspace.createdAt,
    };
    beforeEach(() => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspace);
      workspaceRepository.save.mockResolvedValue(mockUpdatedWorkspace);
    });
    it('should return workspace object', async () => {
      const result = await service.update(
        userId,
        mockWorkspace.id,
        updateWorkspaceDto,
      );
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockWorkspace.id,
          owner: {
            id: userId,
          },
        },
        relations: {
          owner: true,
        },
      });
      expect(result).toEqual(mockWorkspaceResponse);
    });
  });

  describe('remove', () => {
    const id = 'abc123';
    const userId = 'xyz123';
    const mockWorkspace = {
      id,
      name: 'workspace_name',
      owner: {
        id: userId,
      },
      createdAt: new Date(),
    } as Workspace;

    beforeEach(() => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspace);
      workspaceRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });
    });
    it('should return delete message', async () => {
      const result = await service.remove(userId, id);
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
          owner: {
            id: userId,
          },
        },
      });
      expect(workspaceRepository.delete).toHaveBeenCalledWith(mockWorkspace);
      expect(result).toEqual({ message: 'Workspace deleted successfully' });
    });
  });
});
