import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { json, urlencoded } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Security headers & middleware
  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // CORS
  const webOrigin = configService.get<string>('app.webOrigin') || 'http://localhost:5173';
  app.enableCors({
    origin: [webOrigin, 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SkillNest API')
    .setDescription('SkillNest REST API documentation with Zod DTO validation contracts')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
  logger.log(`SkillNest API is running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
}

bootstrap();
