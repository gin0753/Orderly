import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

import { Roles } from './roles.decorator';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';

export const RequireAdmin = () =>
  applyDecorators(
    Roles(AdminRole.ADMIN),
    UseGuards(AdminJwtAuthGuard, AdminRolesGuard),
  );
