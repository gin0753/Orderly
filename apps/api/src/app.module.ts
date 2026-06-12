import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { MenuModule } from './modules/menu/menu.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    MenuModule,
    OrdersModule,
  ],
})
export class AppModule {}
