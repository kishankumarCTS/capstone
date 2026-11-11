import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity.js';
import { Comment } from './entities/comment.entity.js';
import { Project } from 'src/projects/entities/project.entity.js';
import { User } from 'src/users/entities/user.entities.js';
import { Redis } from 'ioredis';
import { BullModule } from '@nestjs/bullmq';
import { TaskGateway } from './task.gateway.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Comment, Project, User]),
    BullModule.registerQueue({
      name: 'task-assignment',
    }),
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    {
      provide: 'REDIS_CACHE',
      useFactory: (): Redis => {
        return new Redis({ host: 'localhost', port: 6379 });
      },
    },
    TaskGateway,
  ],
})
export class TasksModule {}
