import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every route lives under /api  →  /api/health, /api/reports, ...
  app.setGlobalPrefix('api');

  // Let the Next.js app call this API and send cookies with requests
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Validates every incoming request body against its DTO class
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips fields not in the DTO
      forbidNonWhitelisted: true, // 400 if unknown fields are sent
      transform: true, // converts payloads into DTO instances
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API ready on http://localhost:${port}/api`);
}

bootstrap();
