import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRoles } from '../enums/user-roles.enum.js';
import { User } from 'src/users/entities/user.entities.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRoles[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: User;
    }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return roles.includes(user.role);
  }
}
