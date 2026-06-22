import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { PerformOrderActionDto } from './dto/perform-order-action.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  findAll(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/action')
  performAction(
    @Param('id') id: string,
    @Body() performOrderActionDto: PerformOrderActionDto,
  ) {
    return this.ordersService.performAction(id, performOrderActionDto);
  }
}
