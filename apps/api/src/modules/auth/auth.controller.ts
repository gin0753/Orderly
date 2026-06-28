import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from './auth.types';
import { RequireAdmin } from './decorators/require-admin.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    this.authService.setAuthCookies(response, result);

    return {
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.authService.refresh(
        this.authService.getRefreshTokenFromRequest(request),
      );

      this.authService.setAuthCookies(response, result);

      return {
        user: result.user,
      };
    } catch (error) {
      this.authService.clearAuthCookies(response);

      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    try {
      await this.authService.logout(
        this.authService.getRefreshTokenFromRequest(request),
      );
    } finally {
      this.authService.clearAuthCookies(response);
    }
  }

  @Get('me')
  @RequireAdmin()
  getCurrentAdmin(@Req() request: AuthenticatedRequest) {
    return {
      user: request.user,
    };
  }
}
