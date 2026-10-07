import {
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
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
import { CustomerGoogleOAuthService } from './customer-google-oauth.service';
import { GoogleProvider } from './google-provider';
import { publicCustomer } from './customer-auth.types';
import type { CustomerPrincipal } from './customer-auth.types';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { RequireCustomer } from './decorators/require-customer.decorator';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
} from './dto/customer-credentials.dto';
import {
  GoogleConnectDto,
  GoogleSignInStartDto,
} from './dto/customer-google.dto';
import { CustomerMutationGuard } from './guards/customer-mutation.guard';

@Controller('customer/auth')
@UseGuards(CustomerMutationGuard)
export class CustomerAuthController {
  constructor(
    private readonly service: CustomerAuthService,
    private readonly google: CustomerGoogleOAuthService,
    private readonly googleProvider: GoogleProvider,
  ) {}

  @Get('google/status')
  googleStatus() {
    return { enabled: this.google.enabled };
  }

  @Post('google/start')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async googleStart(
    @Body() dto: GoogleSignInStartDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const started = await this.google.startSignIn(
      dto.returnTo,
      request.cookies?.[CUSTOMER_COOKIES.refresh],
    );
    this.setGoogleBinding(response, started.binding);
    return { authorizationUrl: started.url };
  }

  @Post('google/connect')
  @HttpCode(HttpStatus.OK)
  @RequireCustomer()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async googleConnect(
    @Body() dto: GoogleConnectDto,
    @CurrentCustomer() customer: CustomerPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const started = await this.google.startConnect(
      customer.sessionId,
      dto.password,
    );
    this.setGoogleBinding(response, started.binding);
    return { authorizationUrl: started.url };
  }

  @Get('google/callback')
  @Header('Cache-Control', 'private, no-store')
  async googleCallback(
    @Req() request: CookieRequest,
    @Res() response: Response,
  ) {
    response.clearCookie('orderly_customer_oauth', this.googleCookieOptions());
    let purpose: 'SIGN_IN' | 'CONNECT_GOOGLE' | null = null;
    try {
      purpose = await this.google.callbackPurpose(
        request.query.state,
        request.cookies?.orderly_customer_oauth,
      );
      const callback = new URL(request.originalUrl, this.google.webOrigin);
      const completed = await this.google.complete(
        callback,
        request.cookies?.orderly_customer_oauth,
        request.cookies?.[CUSTOMER_COOKIES.refresh],
      );
      if (completed.result) this.service.setCookies(response, completed.result);
      const destination = new URL(completed.returnPath, this.google.webOrigin);
      destination.searchParams.set('orderlyOAuth', 'complete');
      return response.redirect(303, destination.href);
    } catch (error) {
      const mode =
        error instanceof ConflictException
          ? 'conflict'
          : request.query.error === 'access_denied'
            ? 'cancelled'
            : 'failed';
      const destination = purpose === 'CONNECT_GOOGLE' ? '/account' : '/login';
      return response.redirect(
        303,
        `${this.google.webOrigin}${destination}?google=${mode}`,
      );
    }
  }

  @Get('google/test-provider')
  @Header('Cache-Control', 'no-store')
  googleTestProvider(@Query('state') state: string, @Res() response: Response) {
    if (!this.google.fixture || !/^[A-Za-z0-9_-]{20,200}$/.test(state ?? ''))
      throw new NotFoundException();
    const path = '/api/customer/auth/google/test-provider/authorize';
    const choices = [
      'new',
      'conflict',
      'link',
      'other',
      'web-conflict',
      'web-link',
    ]
      .map(
        (choice) =>
          `<li><a href="${path}?state=${encodeURIComponent(state)}&identity=${choice}">Continue as ${choice}</a></li>`,
      )
      .join('');
    response
      .type('html')
      .send(
        `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Controlled Google provider</title><main><h1>Controlled Google provider</h1><ul>${choices}</ul></main></html>`,
      );
  }

  @Get('google/test-provider/authorize')
  googleTestAuthorize(
    @Query('state') state: string,
    @Query('identity') identity: string,
    @Res() response: Response,
  ) {
    if (!this.google.fixture) throw new NotFoundException();
    return response.redirect(
      303,
      this.googleProvider.fixtureAuthorize(state, identity),
    );
  }

  private setGoogleBinding(response: Response, value: string) {
    response.setHeader('Cache-Control', 'private, no-store');
    response.cookie('orderly_customer_oauth', value, {
      ...this.googleCookieOptions(),
      maxAge: 5 * 60 * 1000,
    });
  }

  private googleCookieOptions() {
    return {
      httpOnly: true,
      secure: this.google.secure,
      sameSite: 'lax' as const,
      path: '/api/customer/auth/google',
    };
  }

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
