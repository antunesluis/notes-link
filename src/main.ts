import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from './common/pipes/parse-int-id.pipe';

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

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
