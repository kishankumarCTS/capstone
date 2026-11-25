import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity.js';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @Inject('REDIS_CACHE') private readonly redis: Redis,
  ) {}

  async findOne(userId: string, projectId: string) {
    const cacheKey = `capstone:project:${projectId}`;
    const cacheProject = await this.redis.get(cacheKey);
    if (cacheProject) {
      const parsedProject = JSON.parse(cacheProject) as Project;
      if (parsedProject.workspace.owner.id === userId) {
        return {
          id: parsedProject.id,
          name: parsedProject.name,
        };
      } else {
        throw new NotFoundException('Project not found');
      }
    }
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        workspace: {
          owner: {
            id: userId,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.redis.set(cacheKey, JSON.stringify(project), 'EX', 60);

    return {
      id: project.id,
      name: project.name,
    };
  }

  async create(createProjectDto: CreateProjectDto) {
    const project = this.projectRepository.create({
      name: createProjectDto.name,
      workspace: {
        id: createProjectDto.workspaceId,
      },
    });
    const savedProject = await this.projectRepository.save(project);
    return {
      id: savedProject.id,
      name: savedProject.name,
      workspace: savedProject.workspace.id,
    };
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectRepository.findOne({
      where: {
        id,
        workspace: {
          owner: {
            id: userId,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(userId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        workspace: {
          owner: {
            id: userId,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectRepository.delete(project.id);
    return {
      message: 'Project removed.',
    };
  }
}
