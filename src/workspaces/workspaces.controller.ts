import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';

import { WorkspacesService } from './workspaces.service.js';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto.js';
import { CurrentUser } from '@nestjs/authentication';
import { User } from 'src/users/entities/user.entities.js';
import { Roles } from 'src/common/decorators/roles.decorator.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { RolesGuard } from 'src/common/guards/roles.guard.js';

@Controller('workspaces')
@UseGuards(RolesGuard)
@Roles(UserRoles.OWNER)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  findAll() {
    return this.workspacesService.findAll();
  }

  @Post()
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.workspacesService.update(user.id, id, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.remove(user.id, id);
  }
}
