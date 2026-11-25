/* eslint-disable @typescript-eslint/unbound-method */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service.js';
import { Workspace } from './entities/workspace.entity.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entities.js';

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

  const userId = 'user123';
  const mockUserDetails = {
    id: userId,
  } as User;
  const createWorkspaceDto = {
    name: 'test_workspace',
  };
  const mockWorkspaceDetails = {
    id: 'abc123',
    name: createWorkspaceDto.name,
    owner: mockUserDetails,
    createdAt: new Date(),
  } as Workspace;

  const mockWorkspaceResponse = {
    id: mockWorkspaceDetails.id,
    name: mockWorkspaceDetails.name,
    owner: mockWorkspaceDetails.owner.id,
    createdAt: mockWorkspaceDetails.createdAt,
  };

  describe('create', () => {
    beforeEach(() => {
      workspaceRepository.create.mockReturnValue(mockWorkspaceDetails);
      workspaceRepository.save.mockResolvedValue(mockWorkspaceDetails);
    });

    it('should return workspace object', async () => {
      const result = await service.create(
        mockWorkspaceDetails.owner,
        createWorkspaceDto,
      );
      expect(workspaceRepository.create).toHaveBeenCalledWith({
        name: mockWorkspaceDetails.name,
        owner: {
          id: mockWorkspaceDetails.owner.id,
        },
      });
      expect(workspaceRepository.save).toHaveBeenCalledWith(
        mockWorkspaceDetails,
      );
      expect(result).toEqual(mockWorkspaceResponse);
    });
  });

  describe('find_one', () => {
    beforeEach(() => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspaceDetails);
    });

    it('should return workspace object', async () => {
      const result = await service.findOne(userId, mockWorkspaceDetails.id);
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockWorkspaceResponse);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspaceDetails);
      workspaceRepository.save.mockResolvedValue({
        ...mockWorkspaceDetails,
        name: 'Updated workspace',
      });
    });
    it('should return workspace object', async () => {
      const result = await service.update(userId, mockWorkspaceDetails.id, {
        name: 'Updated workspace',
      });
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
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
      expect(result).toEqual({
        ...mockWorkspaceResponse,
        name: 'Updated workspace',
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspaceDetails);
      workspaceRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });
    });
    it('should return delete message', async () => {
      const result = await service.remove(userId, mockUserDetails.id);
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUserDetails.id,
          owner: {
            id: userId,
          },
        },
      });
      expect(workspaceRepository.delete).toHaveBeenCalledWith(
        mockWorkspaceDetails.id,
      );
      expect(result).toEqual({ message: 'Workspace deleted successfully' });
    });
  });
});
