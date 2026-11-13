import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../features/auth/types/user-roles.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRepository } from '../../features/user/repository/user.repository.js';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;
    if (!userId) throw new UnauthorizedException();
    const user = await this.userRepo.getById(userId);
    if (!user) throw new UnauthorizedException();
    return requiredRoles.includes(user.role);
  }
}
