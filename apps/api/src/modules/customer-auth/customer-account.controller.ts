import {
  Body,
  Get,
  Req,
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
import type { CookieRequest } from '../auth/auth.types';
import {
  CustomerDeletionService,
  DELETION_COOKIES,
} from './customer-deletion.service';
import { CustomerAuthService } from './customer-auth.service';
import type { CustomerPrincipal } from './customer-auth.types';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { RequireCustomer } from './decorators/require-customer.decorator';
import {
  CustomerPasswordChangeDto,
  CustomerProfileDto,
  CustomerDeleteDto,
} from './dto/customer-account.dto';
import { CustomerMutationGuard } from './guards/customer-mutation.guard';

import { PrivateResponse } from '../../http/private-response.interceptor';

@PrivateResponse()
@Controller('customer/account')
@UseGuards(CustomerMutationGuard)
@RequireCustomer()
export class CustomerAccountController {
  constructor(
    private readonly auth: CustomerAuthService,
    private readonly deletion: CustomerDeletionService,
  ) {}

  @Get('deletion/status')
  status(
    @CurrentCustomer() customer: CustomerPrincipal,
    @Req() request: CookieRequest,
  ) {
    return this.deletion.ready(
      customer.id,
      customer.sessionId,
      request.cookies?.[DELETION_COOKIES.grant],
      request.cookies?.[DELETION_COOKIES.browser],
    );
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async deleteAccount(
    @CurrentCustomer() customer: CustomerPrincipal,
    @Body() dto: CustomerDeleteDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.deletion.delete(
      customer.id,
      customer.sessionId,
      dto.currentPassword,
      request.cookies?.[DELETION_COOKIES.grant],
      request.cookies?.[DELETION_COOKIES.browser],
      dto.savedReceiptNumber,
    );
    this.auth.clearCookies(response);
    this.deletion.clearCookies(response);
    return result;
  }

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
    this.deletion.clearCookies(response);
    return { user: result.user };
  }
}
