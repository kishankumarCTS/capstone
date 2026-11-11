import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity.js';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto.js';
import { Project } from 'src/projects/entities/project.entity.js';
import { User } from 'src/users/entities/user.entities.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { Comment } from './entities/comment.entity.js';
import { AddCommentDto } from './dto/comment.dto.js';
import { Redis } from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @Inject('REDIS_CACHE') private readonly redis: Redis,
    @InjectQueue('task-assignment') private readonly taskAssignmentQueue: Queue,
  ) {}

  async findAll({
    assigneeId,
    limit = 10,
    page = 0,
    priority,
    projectId,
    sortBy = 'ASC',
    status,
  }: {
    projectId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'ASC' | 'DESC';
  }) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'dueDate',
      'title',
      'priority',
      'status',
    ];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException('Invalid sortBy field');
    }
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee');

    if (projectId) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }
    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }
    const total = await queryBuilder.getCount();
    const allowedColumns = [
      'createdAt',
      'updatedAt',
      'dueDate',
      'title',
      'priority',
      'status',
    ];
    if (!allowedColumns.includes(sortBy)) {
      throw new BadRequestException('Invalid sort field');
    }
    const tasks = await queryBuilder
      .orderBy(`task.${sortBy}`, 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const cacheKey = `capsote:task:${id}`;
    const cachedTask = await this.redis.get(cacheKey);

    if (cachedTask) {
      console.log(`Cache HIT for Task ID: ${id}`);
      console.log(cachedTask);
      return JSON.parse(cachedTask) as Task;
    }

    console.log(`🐢 Cache MISS for task ID: ${id}. Fetching from DB...`);
    const task = await this.taskRepository.findOne({
      where: {
        id,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    await this.redis.set(cacheKey, JSON.stringify(task), 'EX', 60);
    return task;
  }

  async create(createTaskDto: CreateTaskDto) {
    const project = await this.projectRepository.findOne({
      where: {
        id: createTaskDto.projectId,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: createTaskDto.assignee,
      },
    });
    if (!user) {
      throw new NotFoundException('Assignee not found.');
    }

    const createdTask = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status,
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate,
      project: project,
      assignee: user,
    });

    return await this.taskRepository.save(createdTask);
  }

  async update(user: User, taskId: string, updateTaskDto: UpdateTaskDto) {
    const where: FindOptionsWhere<Task> = { id: taskId };

    if (user.role === UserRoles.MEMBER) {
      where.assignee = { id: user.id };
    }

    const task = await this.taskRepository.findOne({ where });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    if (user.role === UserRoles.MEMBER) {
      Object.assign(task, {
        description: updateTaskDto.description ?? task.description,
        status: updateTaskDto.status ?? task.status,
        priority: updateTaskDto.priority ?? task.priority,
      });
    } else if (user.role === UserRoles.OWNER) {
      if (updateTaskDto.assigneeId) {
        const assignee = await this.userRepository.findOne({
          where: { id: updateTaskDto.assigneeId },
        });

        if (!assignee) {
          throw new NotFoundException('Assignee not found.');
        }

        task.assignee = assignee;
      }

      Object.assign(task, {
        title: updateTaskDto.title ?? task.title,
        description: updateTaskDto.description ?? task.description,
        status: updateTaskDto.status ?? task.status,
        priority: updateTaskDto.priority ?? task.priority,
        dueDate: updateTaskDto.dueDate ?? task.dueDate,
      });
    }

    if (where.assignee) {
      await this.taskAssignmentQueue.add('notify-subscribers', {
        taskId: task.id,
      });
      console.log(
        `📤 Enqueued 'notify-subscribers' job for new task ID: ${task.id}`,
      );
    }

    return this.taskRepository.save(task);
  }

  async remove(id: string) {
    const task = await this.taskRepository.findOne({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);
    return {
      message: 'Task deleted',
    };
  }

  async findComments(taskId: string) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const comments = await this.commentRepository.find({
      where: {
        task: {
          id: taskId,
        },
      },
    });

    return comments;
  }

  async addComment(taskId: string, user: User, addCommentDto: AddCommentDto) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const newComment = this.commentRepository.create({
      author: user,
      body: addCommentDto.body,
      task: task,
    });

    return this.commentRepository.save(newComment);
  }

  async deleteComment(taskId: string, comment_id: string) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = await this.commentRepository.findOne({
      where: {
        id: comment_id,
      },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentRepository.remove(comment);
    return {
      message: 'Comment deleted',
    };
  }
}
