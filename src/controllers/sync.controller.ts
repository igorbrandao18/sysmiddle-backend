import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SyncService } from '../services/sync.service';
import { SyncBoardDto } from '../dto/sync-board.dto';

@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('board')
  async syncBoard(@Body() syncBoardDto: SyncBoardDto) {
    try {
      const result = await this.syncService.syncBoardToProject(
        syncBoardDto.boardId,
        syncBoardDto.workspaceId,
      );
      return {
        statusCode: HttpStatus.CREATED,
        ...result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 