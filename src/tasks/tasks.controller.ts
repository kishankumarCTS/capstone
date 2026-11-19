import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { RolesGuard } from 'src/common/guards/roles.guard.js';
import { Roles } from 'src/common/decorators/roles.decorator.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto.js';
import { CurrentUser } from '@nestjs/authentication';
import { User } from 'src/users/entities/user.entities.js';
import { AddCommentDto } from './dto/comment.dto.js';
import { TaskPriority, TaskStatus } from './entities/task.entity.js';

@Controller('tasks')
@UseGuards(RolesGuard)
@Roles(UserRoles.OWNER)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Get()
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit?: number,
    @Query('sortBy') sortBy?: 'ASC' | 'DESC',
  ) {
    return this.taskService.findAll({
      projectId,
      status,
      assigneeId,
      page,
      limit,
      sortBy,
      priority,
    });
  }

  @Get('/:id')
  @Roles(UserRoles.OWNER, UserRoles.MEMBER)
  findOneTask(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Patch('/:id')
  @Roles(UserRoles.OWNER, UserRoles.MEMBER)
  updateTask(
    @CurrentUser() user: User,
    @Body() updateTaskDto: UpdateTaskDto,
    @Param('id') id: string,
  ) {
    return this.taskService.update(user, id, updateTaskDto);
  }

  @Delete('/:id')
  deleteTask(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  @Get('/:id/comments')
  getComments(@Param('id') id: string) {
    return this.taskService.findComments(id);
  }

  @Post('/:id/comments')
  @Roles(UserRoles.OWNER, UserRoles.MEMBER)
  addComment(
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.taskService.addComment(id, user, addCommentDto);
  }

  @Delete('/:id/comments/:comment_id')
  deleteComment(@Param('id') id: string, comment_id: string) {
    return this.taskService.deleteComment(id, comment_id);
  }
}
