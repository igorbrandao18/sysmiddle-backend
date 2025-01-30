import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get trelloApiKey(): string {
    return process.env.TRELLO_API_KEY || this.configService.get<string>('TRELLO_API_KEY');
  }

  get trelloToken(): string {
    return process.env.TRELLO_TOKEN || this.configService.get<string>('TRELLO_TOKEN');
  }

  get asanaAccessToken(): string {
    return process.env.ASANA_ACCESS_TOKEN || this.configService.get<string>('ASANA_ACCESS_TOKEN');
  }

  get<T>(key: string): T {
    return process.env[key] as T || this.configService.get<T>(key);
  }
} 