import { Module } from '@nestjs/common';
import { NotesModule } from 'src/notes/notes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'notesuser',
      database: 'notesdb',
      password: 'secretpassword',
      // Loading entities automatically
      autoLoadEntities: true,
      // Synchronize whith database (true for development, false for production)
      synchronize: true,
    }),
    NotesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
