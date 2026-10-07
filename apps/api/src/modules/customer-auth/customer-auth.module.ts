import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerAuthConfig } from './customer-auth.config';
import { CustomerAccountController } from './customer-account.controller';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerGoogleOAuthService } from './customer-google-oauth.service';
import { GoogleOAuthConfig } from './google-oauth.config';
import { GoogleProvider } from './google-provider';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from './guards/optional-customer-jwt-auth.guard';
import { CustomerMutationGuard } from './guards/customer-mutation.guard';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [CustomerAuthController, CustomerAccountController],
  providers: [
    CustomerAuthConfig,
    CustomerAuthService,
    CustomerGoogleOAuthService,
    GoogleOAuthConfig,
    GoogleProvider,
    CustomerJwtStrategy,
    CustomerJwtAuthGuard,
    OptionalCustomerJwtAuthGuard,
    CustomerMutationGuard,
  ],
  exports: [CustomerJwtAuthGuard, OptionalCustomerJwtAuthGuard],
})
export class CustomerAuthModule {}
