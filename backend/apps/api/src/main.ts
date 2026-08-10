import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter, TransformInterceptor } from '@video-analytics/common';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(ConfigService);

  await app.register(fastifyHelmet, {
    // Default 'same-origin' silently blocks <video>/hls.js loading recordings
    // and live-stream segments from the frontend's origin (different port =
    // different origin) — the browser drops the request before it's even
    // sent, with no visible error except in the console. CORS (below)
    // already governs which origins may embed this API's responses; this
    // only relaxes the separate, stricter Cross-Origin-Resource-Policy check.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(fastifyMultipart, {
    limits: { fileSize: config.get<number>('MAX_UPLOAD_SIZE_MB', 500) * 1024 * 1024, files: 1 },
  });
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN', '*') });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Video Analytics Platform API')
    .setDescription('Core API gateway for the AI Video Analytics Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on port ${port}`);
}

bootstrap();
