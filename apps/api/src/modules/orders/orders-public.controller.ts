import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../customer-auth/decorators/current-customer.decorator';
import type { CustomerPrincipal } from '../customer-auth/customer-auth.types';
import { OptionalCustomerJwtAuthGuard } from '../customer-auth/guards/optional-customer-jwt-auth.guard';

import { CreateOrderDto } from './dto/create-order.dto';
import { GuestOrderLookupDto } from './dto/guest-order-lookup.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersPublicController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalCustomerJwtAuthGuard)
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentCustomer() customer?: CustomerPrincipal,
  ) {
    return this.ordersService.createOrder(createOrderDto, customer?.id ?? null);
  }

  @Post('guest/lookup')
  lookupGuestOrder(@Body() dto: GuestOrderLookupDto) {
    return this.ordersService.lookupGuestOrder(dto);
  }
}
