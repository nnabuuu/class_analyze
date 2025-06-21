import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { LocalStorageModule } from './local-storage/local-storage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TaskModule,
    LocalStorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
