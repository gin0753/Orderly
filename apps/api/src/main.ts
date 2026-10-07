import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  if (
    process.env.NODE_ENV === 'production' &&
    Buffer.byteLength(process.env.ORDERLY_PROXY_IDENTITY_SECRET ?? '', 'utf8') <
      32
  ) {
    throw new Error(
      'ORDERLY_PROXY_IDENTITY_SECRET must contain at least 32 bytes.',
    );
  }

  app.use(cookieParser());

  app.enableCors({
    origin: configService.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port =
    configService.get<number>('PORT') ??
    configService.get<number>('API_PORT') ??
    4000;

  await app.listen(port);

  console.log(`API running on http://localhost:${port}/api`);
}

void bootstrap();
