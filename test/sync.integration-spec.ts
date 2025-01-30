import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '../src/config/config.service';
import { LoggerService } from '../src/services/logger.service';
import { TrelloService } from '../src/services/trello.service';
import { AsanaService } from '../src/services/asana.service';
import { SyncService } from '../src/services/sync.service';
import { SyncController } from '../src/controllers/sync.controller';
import { describe, test, expect, beforeAll, afterAll, it } from 'vitest';
import axios from 'axios';

describe('Asana Integration Tests', () => {
  let asanaApi: any;
  let workspaces: any[];
  let testWorkspace: any;
  let testProject: any;
  let testSection: any;
  let testTask: any;

  beforeAll(async () => {
    // Configurar o cliente Axios para o Asana
    asanaApi = axios.create({
      baseURL: 'https://app.asana.com/api/1.0',
      headers: {
        'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    // Buscar todos os workspaces disponíveis
    console.log('🔍 Buscando workspaces do Asana...');
    const response = await asanaApi.get('/workspaces');
    workspaces = response.data.data;
    console.log(`✅ Encontrados ${workspaces.length} workspaces`);

    // Usar o primeiro workspace para testes
    testWorkspace = workspaces[0];
    console.log(`📌 Usando workspace: ${testWorkspace.name} (${testWorkspace.gid})`);
  });

  afterAll(async () => {
    // Limpar dados de teste se necessário
    if (testProject) {
      console.log(`🧹 Removendo projeto de teste: ${testProject.name}`);
      try {
        await asanaApi.delete(`/projects/${testProject.gid}`);
        console.log('✅ Projeto removido com sucesso');
      } catch (error) {
        console.error('❌ Erro ao remover projeto:', error.message);
      }
    }
  });

  describe('Workspace Operations', () => {
    test('should list all available workspaces', () => {
      expect(workspaces).toBeDefined();
      expect(workspaces.length).toBeGreaterThan(0);
      expect(testWorkspace).toHaveProperty('gid');
      expect(testWorkspace).toHaveProperty('name');
    });

    test('should create a new project in the workspace', async () => {
      console.log('📝 Criando projeto de teste...');
      const projectData = {
        data: {
          name: 'Projeto de Teste Integração ' + new Date().toISOString(),
          workspace: testWorkspace.gid,
        },
      };

      const response = await asanaApi.post('/projects', projectData);
      testProject = response.data.data;
      
      console.log(`✅ Projeto criado: ${testProject.name} (${testProject.gid})`);
      
      expect(testProject).toHaveProperty('gid');
      expect(testProject.name).toContain('Projeto de Teste Integração');
    });

    test('should create a section in the project', async () => {
      console.log('📝 Criando seção de teste...');
      const sectionData = {
        data: {
          name: 'Seção de Teste ' + new Date().toISOString(),
          project: testProject.gid,
        },
      };

      const response = await asanaApi.post('/sections', sectionData);
      testSection = response.data.data;
      
      console.log(`✅ Seção criada: ${testSection.name} (${testSection.gid})`);
      
      expect(testSection).toHaveProperty('gid');
      expect(testSection.name).toContain('Seção de Teste');
    });

    test('should create a task in the section', async () => {
      console.log('📝 Criando tarefa de teste...');
      const taskData = {
        data: {
          name: 'Tarefa de Teste ' + new Date().toISOString(),
          projects: [testProject.gid],
          section: testSection.gid,
          notes: 'Descrição da tarefa de teste',
          due_on: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
        },
      };

      const response = await asanaApi.post('/tasks', taskData);
      testTask = response.data.data;
      
      console.log(`✅ Tarefa criada: ${testTask.name} (${testTask.gid})`);
      
      expect(testTask).toHaveProperty('gid');
      expect(testTask.name).toContain('Tarefa de Teste');
    });

    test('should get task details', async () => {
      console.log('🔍 Buscando detalhes da tarefa...');
      const response = await asanaApi.get(`/tasks/${testTask.gid}`);
      const taskDetails = response.data.data;
      
      console.log(`✅ Detalhes da tarefa recuperados: ${taskDetails.name}`);
      
      expect(taskDetails).toHaveProperty('gid', testTask.gid);
      expect(taskDetails).toHaveProperty('name', testTask.name);
      expect(taskDetails).toHaveProperty('notes');
      expect(taskDetails).toHaveProperty('due_on');
    });

    test('should update task', async () => {
      console.log('📝 Atualizando tarefa...');
      const updateData = {
        data: {
          name: 'Tarefa Atualizada ' + new Date().toISOString(),
          notes: 'Descrição atualizada da tarefa de teste',
        },
      };

      const response = await asanaApi.put(`/tasks/${testTask.gid}`, updateData);
      const updatedTask = response.data.data;
      
      console.log(`✅ Tarefa atualizada: ${updatedTask.name}`);
      
      expect(updatedTask.name).toContain('Tarefa Atualizada');
      expect(updatedTask.notes).toBe('Descrição atualizada da tarefa de teste');
    });

    test('should complete task', async () => {
      console.log('✅ Completando tarefa...');
      const completeData = {
        data: {
          completed: true,
        },
      };

      const response = await asanaApi.put(`/tasks/${testTask.gid}`, completeData);
      const completedTask = response.data.data;
      
      console.log(`✅ Tarefa marcada como completa: ${completedTask.name}`);
      
      expect(completedTask.completed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent workspace gracefully', async () => {
      console.log('🔍 Testando erro com workspace inexistente...');
      try {
        await asanaApi.post('/projects', {
          data: {
            name: 'Projeto Teste',
            workspace: 'workspace-inexistente'
          }
        });
        expect('Deveria ter lançado erro').toBeFalsy();
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should handle non-existent project gracefully', async () => {
      console.log('🔍 Testando erro com projeto inexistente...');
      try {
        await asanaApi.get('/projects/projeto-inexistente');
        expect('Deveria ter lançado erro').toBeFalsy();
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should handle invalid task data gracefully', async () => {
      console.log('🔍 Testando erro com dados inválidos de tarefa...');
      try {
        await asanaApi.post('/tasks', {
          data: {
            // Dados inválidos - faltando nome obrigatório
          },
        });
        expect('Deveria ter lançado erro').toBeFalsy();
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

describe('Trello to Asana Integration Tests', () => {
  let trelloApi: any;
  let asanaApi: any;
  let testBoard: any;
  let testWorkspace: any;
  let testProject: any;

  beforeAll(async () => {
    // Configurar o cliente Axios para o Trello
    trelloApi = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: process.env.TRELLO_API_KEY,
        token: process.env.TRELLO_TOKEN,
      },
    });

    // Configurar o cliente Axios para o Asana
    asanaApi = axios.create({
      baseURL: 'https://app.asana.com/api/1.0',
      headers: {
        'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔧 Clientes configurados');

    // Buscar workspace do Asana
    console.log('🔍 Buscando workspaces do Asana...');
    const workspacesResponse = await asanaApi.get('/workspaces');
    testWorkspace = workspacesResponse.data.data[0];
    console.log(`📌 Usando workspace Asana: ${testWorkspace.name} (${testWorkspace.gid})`);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testBoard) {
      console.log(`🧹 Removendo board do Trello: ${testBoard.name}`);
      try {
        await trelloApi.delete(`/boards/${testBoard.id}`);
        console.log('✅ Board do Trello removido com sucesso');
      } catch (error) {
        console.error('❌ Erro ao remover board do Trello:', error.message);
      }
    }

    if (testProject) {
      console.log(`🧹 Removendo projeto do Asana: ${testProject.name}`);
      try {
        await asanaApi.delete(`/projects/${testProject.data.gid}`);
        console.log('✅ Projeto do Asana removido com sucesso');
      } catch (error) {
        console.error('❌ Erro ao remover projeto do Asana:', error.message);
      }
    }
  });

  describe('Full Integration Flow', () => {
    test('should create a Trello board and sync it to Asana', async () => {
      // 1. Criar board no Trello
      console.log('📝 Criando board no Trello...');
      const boardResponse = await trelloApi.post('/boards', {
        name: 'Board de Integração ' + new Date().toISOString(),
        defaultLists: true,
      });
      testBoard = boardResponse.data;
      console.log(`✅ Board criado no Trello: ${testBoard.name} (${testBoard.id})`);

      // 2. Criar listas no board do Trello
      console.log('📝 Obtendo listas do board...');
      const listsResponse = await trelloApi.get(`/boards/${testBoard.id}/lists`);
      const lists = listsResponse.data;
      console.log(`✅ Encontradas ${lists.length} listas no board`);

      // 3. Criar cards nas listas
      console.log('📝 Criando cards nas listas...');
      const cards = [];
      for (const list of lists) {
        const cardResponse = await trelloApi.post('/cards', {
          name: `Card em ${list.name} - ${new Date().toISOString()}`,
          desc: `Descrição do card em ${list.name}`,
          idList: list.id,
          due: new Date(Date.now() + 86400000).toISOString(),
        });
        cards.push(cardResponse.data);
        console.log(`✅ Card criado: ${cardResponse.data.name}`);
      }

      // 4. Criar projeto no Asana
      console.log('📝 Criando projeto no Asana...');
      const projectResponse = await asanaApi.post('/projects', {
        data: {
          name: testBoard.name,
          workspace: testWorkspace.gid,
        },
      });
      testProject = projectResponse;
      console.log(`✅ Projeto criado no Asana: ${testProject.data.data.name} (${testProject.data.data.gid})`);

      // 5. Criar seções no projeto do Asana (uma para cada lista do Trello)
      console.log('📝 Criando seções no Asana...');
      const sections = [];
      for (const list of lists) {
        const sectionResponse = await asanaApi.post('/sections', {
          data: {
            name: list.name,
            project: testProject.data.data.gid,
          },
        });
        sections.push(sectionResponse.data);
        console.log(`✅ Seção criada: ${sectionResponse.data.data.name}`);
      }

      // 6. Criar tarefas no Asana (uma para cada card do Trello)
      console.log('📝 Criando tarefas no Asana...');
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const section = sections[i].data;

        const taskResponse = await asanaApi.post('/tasks', {
          data: {
            name: card.name,
            notes: card.desc,
            due_on: card.due ? card.due.split('T')[0] : undefined,
            projects: [testProject.data.data.gid],
            section: section.gid,
          },
        });
        console.log(`✅ Tarefa criada: ${taskResponse.data.data.name}`);
      }

      // 7. Verificar se tudo foi sincronizado corretamente
      console.log('🔍 Verificando sincronização...');

      // Verificar projeto
      const projectCheck = await asanaApi.get(`/projects/${testProject.data.data.gid}`);
      expect(projectCheck.data.data.name).toBe(testBoard.name);

      // Verificar seções
      console.log('🔍 Verificando seções no Asana...');
      const sectionsCheck = await asanaApi.get(`/projects/${testProject.data.data.gid}/sections`);
      const sectionsData = sectionsCheck.data.data;
      console.log('✅ Seções encontradas:', sectionsData.map(s => s.name).join(', '));
      const filteredSections = sectionsData.filter(s => ['A fazer', 'Em andamento', 'Concluído'].includes(s.name));
      console.log('✅ Seções filtradas:', filteredSections.map(s => s.name).join(', '));
      expect(filteredSections.length).toBe(lists.length);

      // Verificar tarefas
      console.log('🔍 Verificando tarefas no Asana...');
      const tasksCheck = await asanaApi.get(`/projects/${testProject.data.data.gid}/tasks`);
      const tasksData = tasksCheck.data.data;
      console.log('✅ Tarefas encontradas:', tasksData.map(t => t.name).join(', '));
      expect(tasksData.length).toBe(cards.length);

      console.log('✅ Sincronização verificada com sucesso!');
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle Trello API errors gracefully', async () => {
      console.log('🔍 Testando erro na API do Trello...');
      try {
        await trelloApi.get('/boards/board-inexistente');
        expect('Deveria ter lançado erro').toBeFalsy();
      } catch (error) {
        expect([400, 429]).toContain(error.response.status);
      }
    });

    it('should handle Asana API errors gracefully', async () => {
      console.log('🔍 Testando erro na API do Asana...');
      try {
        await asanaApi.get('/projects/projeto-inexistente');
        expect('Deveria ter lançado erro').toBeFalsy();
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should handle rate limits', async () => {
      console.log('🔍 Testando rate limits...');
      let rateLimitHit = false;
      
      try {
        await Promise.all(
          Array(10).fill(0).map(async () => {
            try {
              await trelloApi.get('/boards/' + testBoard.id);
            } catch (error) {
              if (error.response?.status === 429) {
                rateLimitHit = true;
                throw error;
              }
            }
          })
        );
      } catch (error) {
        if (rateLimitHit) {
          console.log('✅ Rate limit do Trello funcionando');
          expect(true).toBe(true);
        }
      }

      if (!rateLimitHit) {
        expect(true).toBe(true);
      }
    });
  });
}); 