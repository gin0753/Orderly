import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { RequireAdmin } from '../auth/decorators/require-admin.decorator';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { PerformOrderActionDto } from './dto/perform-order-action.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@RequireAdmin()
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

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
