import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '../src/config/config.service';
import { LoggerService } from '../src/services/logger.service';
import { TrelloService } from '../src/services/trello.service';
import { AsanaService } from '../src/services/asana.service';
import { SyncService } from '../src/services/sync.service';
import { SyncController } from '../src/controllers/sync.controller';
import { describe, it, expect, beforeAll, vi, beforeEach, afterAll } from 'vitest';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';

describe('SyncController (e2e)', () => {
  let app: INestApplication;
  let mockTrelloService: Partial<TrelloService>;
  let mockAsanaService: Partial<AsanaService>;
  let mockSyncService: Partial<SyncService>;

  beforeAll(async () => {
    // Mock do TrelloService
    mockTrelloService = {
      getBoard: vi.fn().mockImplementation(async (boardId: string) => {
        if (boardId === 'invalid-board') {
          throw new Error('Board not found');
        }
        return {
          id: boardId,
          name: 'Test Board',
        };
      }),
      getBoardLists: vi.fn().mockResolvedValue([
        { id: 'list1', name: 'List 1' },
      ]),
      getListCards: vi.fn().mockResolvedValue([
        { id: 'card1', name: 'Card 1', desc: 'Description 1', due: '2024-03-25' },
      ]),
    };

    // Mock do AsanaService
    mockAsanaService = {
      createProject: vi.fn().mockImplementation(async (name: string, workspaceId: string) => {
        if (workspaceId === 'invalid-workspace') {
          throw new Error('Invalid workspace');
        }
        return {
          data: {
            gid: 'project1',
            name,
          },
        };
      }),
      createSection: vi.fn().mockResolvedValue({
        data: {
          gid: 'section1',
          name: 'List 1',
        },
      }),
      createTask: vi.fn().mockResolvedValue({
        data: {
          gid: 'task1',
          name: 'Card 1',
        },
      }),
    };

    // Mock do SyncService
    mockSyncService = {
      syncBoardToProject: vi.fn().mockImplementation(async (boardId: string, workspaceId: string) => {
        try {
          // Primeiro, tenta obter o board do Trello
          await mockTrelloService.getBoard(boardId);
          
          // Se conseguiu obter o board, tenta criar o projeto no Asana
          await mockAsanaService.createProject('Test Board', workspaceId);
          
          return {
            success: true,
            message: 'Sync completed successfully',
          };
        } catch (error) {
          if (error.message === 'Board not found') {
            throw new Error('Board not found');
          }
          if (error.message === 'Invalid workspace') {
            throw new Error('Invalid workspace');
          }
          throw error;
        }
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(ConfigService)
    .useValue({
      get: vi.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'TRELLO_API_KEY':
            return 'test-api-key';
          case 'TRELLO_TOKEN':
            return 'test-token';
          case 'ASANA_ACCESS_TOKEN':
            return 'test-access-token';
          default:
            return undefined;
        }
      }),
    })
    .overrideProvider(LoggerService)
    .useValue({
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })
    .overrideProvider(TrelloService)
    .useValue(mockTrelloService)
    .overrideProvider(AsanaService)
    .useValue(mockAsanaService)
    .overrideProvider(SyncService)
    .useValue(mockSyncService)
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Configuração do ValidationPipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/sync/board (POST)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should sync a Trello board to an Asana project', async () => {
      const boardId = 'board123';
      const workspaceId = 'workspace123';

      const response = await request(app.getHttpServer())
        .post('/sync/board')
        .send({
          boardId,
          workspaceId,
        })
        .expect(201);

      expect(response.body).toEqual({
        statusCode: 201,
        success: true,
        message: 'Sync completed successfully',
      });

      expect(mockSyncService.syncBoardToProject).toHaveBeenCalledWith(boardId, workspaceId);
    });

    it('should handle invalid board ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/sync/board')
        .send({
          boardId: 'invalid-board',
          workspaceId: 'workspace123',
        })
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Board not found',
      });
    });

    it('should handle invalid workspace ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/sync/board')
        .send({
          boardId: 'board123',
          workspaceId: 'invalid-workspace',
        })
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Invalid workspace',
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/sync/board')
        .send({})
        .expect(400);

      expect(response.body.message).toEqual([
        'boardId should not be empty',
        'boardId must be a string',
        'workspaceId should not be empty',
        'workspaceId must be a string',
      ]);
    });
  });
}); 