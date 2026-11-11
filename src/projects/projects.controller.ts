import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';
import { RolesGuard } from 'src/common/guards/roles.guard.js';
import { Roles } from 'src/common/decorators/roles.decorator.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { CurrentUser } from '@nestjs/authentication';
import { User } from 'src/users/entities/user.entities.js';

@Controller('projects')
@UseGuards(RolesGuard)
@Roles(UserRoles.OWNER)
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @Post()
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Patch('/:id')
  updateProject(
    @CurrentUser() user: User,
    @Body() updateProjectDto: UpdateProjectDto,
    @Param('id') id: string,
  ) {
    return this.projectService.update(user.id, id, updateProjectDto);
  }
}
