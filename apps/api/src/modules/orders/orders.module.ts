import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersPublicController } from './orders-public.controller';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersPublicController, OrdersAdminController],
  providers: [OrdersService],
})
export class OrdersModule {}
