import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { CookieRequest } from '../auth/auth.types';
import { CUSTOMER_COOKIES } from './customer-auth.config';
import { CustomerAuthService } from './customer-auth.service';
import { publicCustomer } from './customer-auth.types';
import type { CustomerPrincipal } from './customer-auth.types';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { RequireCustomer } from './decorators/require-customer.decorator';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
} from './dto/customer-credentials.dto';
import { CustomerMutationGuard } from './guards/customer-mutation.guard';

@Controller('customer/auth')
@UseGuards(CustomerMutationGuard)
export class CustomerAuthController {
  constructor(private readonly service: CustomerAuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: CustomerRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.register(dto);
    this.service.setCookies(response, result);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: CustomerLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.login(dto);
    this.service.setCookies(response, result);
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.service.refresh(
        request.cookies?.[CUSTOMER_COOKIES.refresh],
      );
      this.service.setCookies(response, result);
      return { user: result.user };
    } catch (error) {
      // Preserve credentials on transient infrastructure failures.
      if (error instanceof UnauthorizedException) {
        this.service.clearCookies(response);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.service.logout(request.cookies?.[CUSTOMER_COOKIES.refresh]);
    this.service.clearCookies(response);
  }

  @Get('me')
  @Header('Cache-Control', 'private, no-store')
  @RequireCustomer()
  me(@CurrentCustomer() customer: CustomerPrincipal) {
    return { user: publicCustomer(customer) };
  }
}
