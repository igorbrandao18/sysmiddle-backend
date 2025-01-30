import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { TrelloBoard, TrelloList, TrelloCard } from '../interfaces/trello.interface';

@Injectable()
export class TrelloService {
  private readonly baseUrl = 'https://api.trello.com/1';
  private auth: string;

  constructor(private configService: ConfigService) {}

  private getAuth(): string {
    if (!this.auth) {
      const trelloApiKey = this.configService.get<string>('TRELLO_API_KEY');
      const trelloToken = this.configService.get<string>('TRELLO_TOKEN');
      this.auth = `key=${trelloApiKey}&token=${trelloToken}`;
    }
    return this.auth;
  }

  async getBoard(boardId: string): Promise<TrelloBoard> {
    const url = `${this.baseUrl}/boards/${boardId}?${this.getAuth()}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Board not found');
      }
      throw new Error(`Failed to get board: ${response.statusText}`);
    }
    return response.json();
  }

  async getBoardLists(boardId: string): Promise<TrelloList[]> {
    const url = `${this.baseUrl}/boards/${boardId}/lists?${this.getAuth()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get board lists: ${response.statusText}`);
    }
    return response.json();
  }

  async getListCards(listId: string): Promise<TrelloCard[]> {
    const url = `${this.baseUrl}/lists/${listId}/cards?${this.getAuth()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get list cards: ${response.statusText}`);
    }
    return response.json();
  }
} 