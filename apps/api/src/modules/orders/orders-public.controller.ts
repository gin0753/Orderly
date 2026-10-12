import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../customer-auth/decorators/current-customer.decorator';
import type { CustomerPrincipal } from '../customer-auth/customer-auth.types';
import { OptionalCustomerJwtAuthGuard } from '../customer-auth/guards/optional-customer-jwt-auth.guard';

import { CreateOrderDto } from './dto/create-order.dto';
import { GuestOrderLookupDto } from './dto/guest-order-lookup.dto';
import { OrdersService } from './orders.service';
import { PrivateResponse } from '../../http/private-response.interceptor';
import { Throttle } from '@nestjs/throttler';
import { ReceiptTrackingGuard } from './receipt-tracking.guard';

@Controller('orders')
@PrivateResponse()
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
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(ReceiptTrackingGuard)
  lookupGuestOrder(
    @Body() dto: GuestOrderLookupDto,
    @CurrentCustomer() customer?: CustomerPrincipal,
  ) {
    return this.ordersService.lookupGuestOrder(dto, customer?.id ?? null);
  }
}
