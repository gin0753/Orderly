import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  CustomerPrincipal,
  CustomerRequest,
} from '../customer-auth.types';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CustomerPrincipal =>
    context.switchToHttp().getRequest<CustomerRequest>().user,
);
