import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerAuthConfig } from './customer-auth.config';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { CustomerMutationGuard } from './guards/customer-mutation.guard';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [CustomerAuthController],
  providers: [
    CustomerAuthConfig,
    CustomerAuthService,
    CustomerJwtStrategy,
    CustomerJwtAuthGuard,
    CustomerMutationGuard,
  ],
  exports: [CustomerJwtAuthGuard],
})
export class CustomerAuthModule {}
