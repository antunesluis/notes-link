import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { NotesModule } from 'src/notes/notes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule, ConfigType } from '@nestjs/config';

import appConfig, { appConfigValidationSchema } from './app.config';

@Module({
  imports: [
    // Ensure ConfigModule is configured to load .env file with Joi validation
    ConfigModule.forRoot({
      isGlobal: true, // Make config global
      envFilePath: ['.env'], // Explicitly specify .env file path
      validationSchema: appConfigValidationSchema, // Add Joi validation
      validationOptions: {
        abortEarly: false, // Show all validation errors
      },
    }),
    ConfigModule.forFeature(appConfig),

    // Async TypeORM Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfig)],
      inject: [appConfig.KEY],
      useFactory: async (appConfiguration: ConfigType<typeof appConfig>) => {
        return {
          type: appConfiguration.db.type,
          host: appConfiguration.db.host,
          port: appConfiguration.db.port,
          username: appConfiguration.db.username,
          database: appConfiguration.db.database,
          password: appConfiguration.db.password,
          autoLoadEntities: appConfiguration.db.autoLoadEntities,
          synchronize: appConfiguration.db.synchronize,
        };
      },
    }),

    // Feature Modules
    NotesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
