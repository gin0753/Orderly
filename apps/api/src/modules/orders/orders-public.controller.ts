import { Body, Controller, Post } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { GuestOrderLookupDto } from './dto/guest-order-lookup.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersPublicController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Post('guest/lookup')
  lookupGuestOrder(@Body() dto: GuestOrderLookupDto) {
    return this.ordersService.lookupGuestOrder(dto);
  }
}
