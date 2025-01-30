import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from './config/config.service';
import { TrelloService } from './services/trello.service';
import { AsanaService } from './services/asana.service';
import { SyncService } from './services/sync.service';
import { LoggerService } from './services/logger.service';
import { SyncController } from './controllers/sync.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [SyncController, AppController],
  providers: [
    ConfigService,
    TrelloService,
    AsanaService,
    SyncService,
    LoggerService,
    AppService,
  ],
})
export class AppModule {}
