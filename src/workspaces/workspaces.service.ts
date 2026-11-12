import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity.js';
import { Repository } from 'typeorm';
import { WorkspaceResponseDto } from './dto/workspace-response.dto.js';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}
  findAll() {
    return {
      message: 'All workspaces fetched successfully',
      data: [],
    };
  }

  async create(
    userId: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = this.workspaceRepository.create({
      name: createWorkspaceDto.name,
      owner: {
        id: userId,
      },
    });
    const savedWorkspace = await this.workspaceRepository.save(workspace);
    return {
      id: savedWorkspace.id,
      name: savedWorkspace.name,
      owner: savedWorkspace.owner.id,
      createdAt: savedWorkspace.createdAt,
    };
  }

  async findOne(userId: string, id: string): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id,
        owner: {
          id: userId,
        },
      },
      relations: {
        owner: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      owner: workspace.owner.id,
      createdAt: workspace.createdAt,
    };
  }

  // PATCH /workspaces/:id
  async update(
    userId: string,
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id,
        owner: {
          id: userId,
        },
      },
      relations: {
        owner: true,
      },
    });
    if (!workspace) {
      throw new NotFoundException('Worspace not found.');
    }

    Object.assign(workspace, updateWorkspaceDto);

    const updatedWorkspace = await this.workspaceRepository.save(workspace);

    return {
      id: updatedWorkspace.id,
      name: updatedWorkspace.name,
      owner: updatedWorkspace.owner.id,
      createdAt: updatedWorkspace.createdAt,
    };
  }

  async remove(userId: string, id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id,
        owner: {
          id: userId,
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.workspaceRepository.delete(workspace);

    return {
      message: 'Workspace deleted successfully',
    };
  }

  // POST /workspaces/:id/members
  addMember() {
    return {
      message: 'Member added to workspace successfully',
    };
  }
}
