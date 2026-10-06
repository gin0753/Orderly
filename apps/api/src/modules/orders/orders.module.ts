import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { OrdersPublicController } from './orders-public.controller';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersService } from './orders.service';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerOrdersService } from './customer-orders.service';

@Module({
  imports: [PrismaModule, CustomerAuthModule],
  controllers: [
    OrdersPublicController,
    OrdersAdminController,
    CustomerOrdersController,
  ],
  providers: [OrdersService, CustomerOrdersService],
})
export class OrdersModule {}
