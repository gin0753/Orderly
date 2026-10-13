import { BadRequestException, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { Response } from 'express';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerDeletionService } from './customer-deletion.service';
import { CustomerRegistrationService } from './customer-registration.service';
import { CustomerGoogleOAuthService } from './customer-google-oauth.service';
import { GoogleProvider } from './google-provider';

describe('Customer registration controller contracts', () => {
  const credentials = {
    email: 'owner@example.test',
    name: 'Synthetic Owner',
    password: 'Synthetic password 123!',
  };
  const completion = {
    token: 'a'.repeat(43),
    name: credentials.name,
    password: credentials.password,
  };
  const response = {} as Response;
  const pending = { status: 'pending', retryAfterSeconds: 60 };
  const result = { user: { id: 'synthetic', emailVerified: false } };
  let registration: {
    mode: 'verified' | 'direct';
    start: jest.Mock;
    direct: jest.Mock;
    check: jest.Mock;
    complete: jest.Mock;
  };
  let setCookies: jest.Mock;
  let controller: CustomerAuthController;

  beforeEach(() => {
    registration = {
      mode: 'verified',
      start: jest.fn().mockResolvedValue(pending),
      direct: jest.fn().mockResolvedValue(result),
      check: jest.fn().mockResolvedValue({ status: 'pending' }),
      complete: jest.fn().mockResolvedValue(result),
    };
    setCookies = jest.fn();
    controller = new CustomerAuthController(
      { setCookies } as unknown as CustomerAuthService,
      {} as CustomerDeletionService,
      registration as unknown as CustomerRegistrationService,
      {} as CustomerGoogleOAuthService,
      {} as GoogleProvider,
    );
  });

  it('exposes each registration route exactly once', () => {
    const prototype = CustomerAuthController.prototype;
    const routes = Object.getOwnPropertyNames(prototype).flatMap((name) => {
      const handler: unknown = Object.getOwnPropertyDescriptor(
        prototype,
        name,
      )?.value;
      if (typeof handler !== 'function') return [];
      const path: unknown = Reflect.getMetadata(PATH_METADATA, handler);
      const method: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
      return typeof path === 'string' &&
        (path === 'register' || path.startsWith('registration/'))
        ? [{ path, method }]
        : [];
    });
    expect(routes).toEqual([
      { path: 'registration/status', method: RequestMethod.GET },
      { path: 'register', method: RequestMethod.POST },
      { path: 'registration/resend', method: RequestMethod.POST },
      { path: 'registration/check', method: RequestMethod.POST },
      { path: 'registration/complete', method: RequestMethod.POST },
    ]);
  });

  it('starts verified registration without issuing cookies or a direct account', async () => {
    await expect(controller.register(credentials, response)).resolves.toEqual(
      pending,
    );
    expect(registration.start).toHaveBeenCalledWith(credentials);
    expect(registration.direct).not.toHaveBeenCalled();
    expect(setCookies).not.toHaveBeenCalled();
  });

  it('dispatches direct registration and sets cookies only after successful creation', async () => {
    registration.mode = 'direct';
    await expect(controller.register(credentials, response)).resolves.toEqual({
      user: result.user,
    });
    expect(registration.direct).toHaveBeenCalledWith(credentials);
    expect(registration.start).not.toHaveBeenCalled();
    expect(setCookies).toHaveBeenCalledWith(response, result);
  });

  it('completes only through the verification service', async () => {
    await controller.completeRegistration(completion, response);
    expect(registration.complete).toHaveBeenCalledWith(completion);
    expect(registration.start).not.toHaveBeenCalled();
    expect(registration.direct).not.toHaveBeenCalled();
    expect(setCookies).toHaveBeenCalledWith(response, result);
  });

  it('propagates invalid proof without setting cookies or falling back to direct registration', async () => {
    const error = new BadRequestException('Invalid verification proof');
    registration.complete.mockRejectedValue(error);
    await expect(
      controller.completeRegistration(completion, response),
    ).rejects.toBe(error);
    expect(setCookies).not.toHaveBeenCalled();
    expect(registration.direct).not.toHaveBeenCalled();
  });

  it('propagates direct creation errors without setting cookies', async () => {
    registration.mode = 'direct';
    const error = new BadRequestException('Registration unavailable');
    registration.direct.mockRejectedValue(error);
    await expect(controller.register(credentials, response)).rejects.toBe(
      error,
    );
    expect(setCookies).not.toHaveBeenCalled();
  });
});
