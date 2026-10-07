import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CustomerAuthService } from './customer-auth.service';
import type { CustomerPrincipal } from './customer-auth.types';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { RequireCustomer } from './decorators/require-customer.decorator';
import {
  CustomerPasswordChangeDto,
  CustomerProfileDto,
} from './dto/customer-account.dto';
import { CustomerMutationGuard } from './guards/customer-mutation.guard';

@Controller('customer/account')
@UseGuards(CustomerMutationGuard)
@RequireCustomer()
export class CustomerAccountController {
  constructor(private readonly auth: CustomerAuthService) {}

  @Patch()
  async updateProfile(
    @CurrentCustomer() customer: CustomerPrincipal,
    @Body() dto: CustomerProfileDto,
  ) {
    return { user: await this.auth.updateProfile(customer.id, dto) };
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @CurrentCustomer() customer: CustomerPrincipal,
    @Body() dto: CustomerPasswordChangeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.changePassword(customer.id, dto);
    this.auth.setCookies(response, result);
    return { user: result.user };
  }
}
