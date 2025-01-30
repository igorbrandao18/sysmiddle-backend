import { Injectable } from '@nestjs/common';
import { TrelloService } from './trello.service';
import { AsanaService } from './asana.service';
import { LoggerService } from './logger.service';

@Injectable()
export class SyncService {
  constructor(
    private trelloService: TrelloService,
    private asanaService: AsanaService,
    private logger: LoggerService,
  ) {}

  async syncBoardToProject(boardId: string, workspaceId: string) {
    try {
      this.logger.log(`Starting sync from Trello board ${boardId} to Asana workspace ${workspaceId}`);

      // 1. Get Trello board
      const board = await this.trelloService.getBoard(boardId);
      this.logger.debug(`Retrieved Trello board: ${board.name}`);
      
      // 2. Create Asana project
      const project = await this.asanaService.createProject(board.name, workspaceId);
      this.logger.debug(`Created Asana project: ${project.data.name}`);
      
      // 3. Get Trello lists
      const lists = await this.trelloService.getBoardLists(boardId);
      this.logger.debug(`Retrieved ${lists.length} lists from Trello board`);
      
      // 4. Create Asana sections for each list
      for (const list of lists) {
        this.logger.debug(`Processing list: ${list.name}`);
        const section = await this.asanaService.createSection(list.name, project.data.gid);
        
        // 5. Get cards from list
        const cards = await this.trelloService.getListCards(list.id);
        this.logger.debug(`Found ${cards.length} cards in list ${list.name}`);
        
        // 6. Create Asana tasks for each card
        for (const card of cards) {
          await this.asanaService.createTask({
            name: card.name,
            notes: card.desc,
            due_on: card.due,
            projects: [project.data.gid],
            section: section.data.gid,
          });
          this.logger.debug(`Created Asana task: ${card.name}`);
        }
      }

      this.logger.log(`Sync completed successfully for board ${boardId}`);
      return { success: true, message: 'Sync completed successfully' };
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`, error.stack);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }
} 