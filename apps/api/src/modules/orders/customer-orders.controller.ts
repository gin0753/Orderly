import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentCustomer } from '../customer-auth/decorators/current-customer.decorator';
import { RequireCustomer } from '../customer-auth/decorators/require-customer.decorator';
import type { CustomerPrincipal } from '../customer-auth/customer-auth.types';
import { CustomerOrdersService } from './customer-orders.service';
import { CustomerOrdersQueryDto } from './dto/customer-orders-query.dto';

import { PrivateResponse } from '../../http/private-response.interceptor';

@PrivateResponse()
@Controller('customer/orders')
@RequireCustomer()
export class CustomerOrdersController {
  constructor(private readonly orders: CustomerOrdersService) {}

  @Get()
  list(
    @CurrentCustomer() customer: CustomerPrincipal,
    @Query() query: CustomerOrdersQueryDto,
  ) {
    return this.orders.list(customer.id, query);
  }

  @Get(':id')
  detail(
    @CurrentCustomer() customer: CustomerPrincipal,
    @Param('id') id: string,
  ) {
    return this.orders.detail(customer.id, id);
  }
}
