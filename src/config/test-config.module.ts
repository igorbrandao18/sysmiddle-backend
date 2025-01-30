import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService } from './config.service';

const testConfig = {
  TRELLO_API_KEY: 'test-key',
  TRELLO_TOKEN: 'test-token',
  ASANA_ACCESS_TOKEN: 'test-token',
};

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => testConfig],
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: ConfigService,
      useFactory: () => {
        const nestConfigService = new NestConfigService(testConfig);
        return new ConfigService(nestConfigService);
      },
    },
  ],
  exports: [ConfigService],
})
export class TestConfigModule {} 