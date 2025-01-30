import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { AsanaProject, AsanaSection, AsanaTask, CreateTaskParams } from '../interfaces/asana.interface';

@Injectable()
export class AsanaService {
  private readonly baseUrl = 'https://app.asana.com/api/1.0';
  private headers: Record<string, string>;

  constructor(private configService: ConfigService) {}

  private getHeaders(): Record<string, string> {
    if (!this.headers) {
      const asanaAccessToken = this.configService.get<string>('ASANA_ACCESS_TOKEN');
      this.headers = {
        'Authorization': `Bearer ${asanaAccessToken}`,
        'Content-Type': 'application/json',
      };
    }
    return this.headers;
  }

  async createProject(name: string, workspaceId: string): Promise<AsanaProject> {
    const url = `${this.baseUrl}/projects`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: {
          name,
          workspace: workspaceId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  }

  async createSection(name: string, projectId: string): Promise<AsanaSection> {
    const url = `${this.baseUrl}/sections`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: {
          name,
          project: projectId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create section');
    }

    return response.json();
  }

  async createTask(params: CreateTaskParams): Promise<AsanaTask> {
    const url = `${this.baseUrl}/tasks`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: {
          name: params.name,
          notes: params.notes,
          due_on: params.due_on,
          projects: params.projects,
          section: params.section,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    return response.json();
  }
} 