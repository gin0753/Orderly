import { applyDecorators, UseGuards } from '@nestjs/common';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';

export const RequireCustomer = () =>
  applyDecorators(UseGuards(CustomerJwtAuthGuard));
