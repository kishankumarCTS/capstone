import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity.js';
import { Redis } from 'ioredis';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    {
      provide: 'REDIS_CACHE',
      useFactory: (): Redis => {
        return new Redis({ host: 'localhost', port: 6379 });
      },
    },
  ],
})
export class ProjectsModule {}
