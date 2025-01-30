import { Test, TestingModule } from '@nestjs/testing';
import { TrelloService } from '../../services/trello.service';
import { AsanaService } from '../../services/asana.service';
import { SyncService } from '../../services/sync.service';
import { ConfigService } from '../../config/config.service';
import { LoggerService } from '../../services/logger.service';
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import * as dotenv from 'dotenv';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Carrega as variáveis de ambiente do arquivo .env.test
dotenv.config({ path: '.env.test' });

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Tests', () => {
  let trelloService: TrelloService;
  let asanaService: AsanaService;
  let syncService: SyncService;
  let configService: ConfigService;
  let loggerService: LoggerService;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  beforeAll(async () => {
    const mockNestConfigService = {
      get: (key: string) => {
        switch (key) {
          case 'TRELLO_API_KEY':
            return process.env.TRELLO_API_KEY;
          case 'TRELLO_TOKEN':
            return process.env.TRELLO_TOKEN;
          case 'ASANA_ACCESS_TOKEN':
            return process.env.ASANA_ACCESS_TOKEN;
          default:
            return process.env[key];
        }
      },
    };

    const mockConfigService = new ConfigService(mockNestConfigService as NestConfigService);

    class MockLoggerService extends Logger implements LoggerService {
      error = vi.fn();
      warn = vi.fn();
      log = vi.fn();
      debug = vi.fn();
    }

    const mockLoggerService = new MockLoggerService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: TrelloService,
          useFactory: () => new TrelloService(mockConfigService),
        },
        {
          provide: AsanaService,
          useFactory: () => new AsanaService(mockConfigService),
        },
        {
          provide: SyncService,
          useFactory: () => new SyncService(
            new TrelloService(mockConfigService),
            new AsanaService(mockConfigService),
            mockLoggerService,
          ),
        },
      ],
    }).compile();

    trelloService = module.get<TrelloService>(TrelloService);
    asanaService = module.get<AsanaService>(AsanaService);
    syncService = module.get<SyncService>(SyncService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  describe('Trello API', () => {
    const boardId = process.env.TEST_TRELLO_BOARD_ID || '65f4c7c0c6e2c1c7f4c0c0c0';

    it('should get board details', async () => {
      const mockBoard = {
        id: boardId,
        name: 'Test Board',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBoard),
      });

      const board = await trelloService.getBoard(boardId);
      expect(board).toBeDefined();
      expect(board.id).toBe(boardId);
      expect(board.name).toBe('Test Board');
    });

    it('should get board lists', async () => {
      const mockLists = [
        { id: 'list1', name: 'List 1' },
        { id: 'list2', name: 'List 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLists),
      });

      const lists = await trelloService.getBoardLists(boardId);
      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
      expect(lists.length).toBe(2);
      expect(lists[0].name).toBe('List 1');
    });

    it('should get list cards', async () => {
      const mockLists = [
        { id: 'list1', name: 'List 1' },
      ];

      const mockCards = [
        { id: 'card1', name: 'Card 1' },
        { id: 'card2', name: 'Card 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLists),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCards),
      });

      const lists = await trelloService.getBoardLists(boardId);
      const firstList = lists[0];
      const cards = await trelloService.getListCards(firstList.id);
      expect(cards).toBeDefined();
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBe(2);
      expect(cards[0].name).toBe('Card 1');
    });
  });

  describe('Asana API', () => {
    const workspaceId = process.env.TEST_ASANA_WORKSPACE_ID || '1209276646303170';

    it('should create and delete a project', async () => {
      const mockProject = {
        data: {
          gid: 'project1',
          name: 'Test Project',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProject),
      });

      const project = await asanaService.createProject('Test Project', workspaceId);
      expect(project).toBeDefined();
      expect(project.data.name).toBe('Test Project');
    });

    it('should create a section in a project', async () => {
      const mockProject = {
        data: {
          gid: 'project1',
          name: 'Test Project',
        },
      };

      const mockSection = {
        data: {
          gid: 'section1',
          name: 'Test Section',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProject),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSection),
      });

      const project = await asanaService.createProject('Test Project', workspaceId);
      const section = await asanaService.createSection('Test Section', project.data.gid);
      expect(section).toBeDefined();
      expect(section.data.name).toBe('Test Section');
    });

    it('should create a task', async () => {
      const mockProject = {
        data: {
          gid: 'project1',
          name: 'Test Project',
        },
      };

      const mockTask = {
        data: {
          gid: 'task1',
          name: 'Test Task',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProject),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      const project = await asanaService.createProject('Test Project', workspaceId);
      const task = await asanaService.createTask({
        name: 'Test Task',
        notes: 'Test Description',
        projects: [project.data.gid],
      });
      expect(task).toBeDefined();
      expect(task.data.name).toBe('Test Task');
    });
  });

  describe('Sync Service', () => {
    const boardId = process.env.TEST_TRELLO_BOARD_ID || '65f4c7c0c6e2c1c7f4c0c0c0';
    const workspaceId = process.env.TEST_ASANA_WORKSPACE_ID || '1209276646303170';

    it('should sync Trello board to Asana project', async () => {
      // Mock Trello API responses
      const mockTrelloBoard = {
        id: boardId,
        name: 'Test Board',
      };

      const mockTrelloLists = [
        { id: 'list1', name: 'List 1' },
      ];

      const mockTrelloCards = [
        { id: 'card1', name: 'Card 1', desc: 'Description 1', due: '2024-03-25' },
      ];

      // Mock Asana API responses
      const mockAsanaProject = {
        data: {
          gid: 'project1',
          name: 'Test Board',
        },
      };

      const mockAsanaSection = {
        data: {
          gid: 'section1',
          name: 'List 1',
        },
      };

      const mockAsanaTask = {
        data: {
          gid: 'task1',
          name: 'Card 1',
        },
      };

      // Setup mock responses in order
      mockFetch
        // Trello getBoard
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrelloBoard),
        })
        // Asana createProject
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAsanaProject),
        })
        // Trello getBoardLists
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrelloLists),
        })
        // Asana createSection
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAsanaSection),
        })
        // Trello getListCards
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrelloCards),
        })
        // Asana createTask
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAsanaTask),
        });

      const result = await syncService.syncBoardToProject(boardId, workspaceId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Sync completed successfully');
    });
  });
}); 