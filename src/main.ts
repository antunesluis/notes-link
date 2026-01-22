import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from './common/pipes/parse-int-id.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  await app.listen(process.env.APP_PORT ?? 3000);
}

bootstrap();
