import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from './common/pipes/parse-int-id.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      // Remove keys that are not in the DTO
      whitelist: true,

      // Throw an error (404) if a key is not in the DTO
      forbidNonWhitelisted: true,
    }),
    new ParseIntIdPipe(),
  );

  const documentBuilderConfig = new DocumentBuilder()
    .setTitle('Notes API')
    .setDescription('API for sharing notes with friends')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilderConfig);

  SwaggerModule.setup('docs', app, document);

  if (process.env.NODE_ENV === 'production') {
    // Helmet to set secure HTTP headers in production
    app.use(helmet());

    // Enable CORS for a specific domain in production
    app.enableCors({
      origin: process.env.CORS_ALLOWED_ORIGINS,
    });
  }

  await app.listen(process.env.APP_PORT ?? 3000);
}

bootstrap();
