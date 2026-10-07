import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module';
import { HealthModule } from './modules/health/health.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProxyThrottlerGuard } from './modules/proxy-identity/proxy-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 100,
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    MenuModule,
    OrdersModule,
    AuthModule,
    CustomerAuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ProxyThrottlerGuard,
    },
  ],
})
export class AppModule {}
