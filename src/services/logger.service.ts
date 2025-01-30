import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  error(message: string, trace: string) {
    super.error(message, trace);
    // Aqui você pode adicionar integrações com serviços de monitoramento
    // como Sentry, DataDog, etc.
  }

  warn(message: string) {
    super.warn(message);
  }

  log(message: string) {
    super.log(message);
  }

  debug(message: string) {
    super.debug(message);
  }
} 