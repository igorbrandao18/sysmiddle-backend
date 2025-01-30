import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from './config/config.service';
import { LoggerService } from './services/logger.service';
import { TrelloService } from './services/trello.service';
import { AsanaService } from './services/asana.service';
import { SyncService } from './services/sync.service';
import { SyncController } from './controllers/sync.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, SyncController],
  providers: [
    AppService,
    ConfigService,
    LoggerService,
    TrelloService,
    AsanaService,
    SyncService,
  ],
})
export class AppModule {}
