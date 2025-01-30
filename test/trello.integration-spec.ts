import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

describe('Trello Integration Tests', () => {
  let trelloApi: any;
  let testBoard: any;
  let testList: any;
  let testCard: any;
  let testChecklist: any;

  beforeAll(async () => {
    // Configurar o cliente Axios para o Trello
    const auth = `key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`;
    trelloApi = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: process.env.TRELLO_API_KEY,
        token: process.env.TRELLO_TOKEN,
      },
    });

    console.log('🔧 Cliente Trello configurado');
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testBoard) {
      console.log(`🧹 Removendo board de teste: ${testBoard.name}`);
      try {
        await trelloApi.delete(`/boards/${testBoard.id}`);
        console.log('✅ Board removido com sucesso');
      } catch (error) {
        console.error('❌ Erro ao remover board:', error.message);
      }
    }
  });

  describe('Board Operations', () => {
    it('should create a new board', async () => {
      console.log('📝 Criando board de teste...');
      const boardData = {
        name: 'Board de Teste Integração ' + new Date().toISOString(),
        defaultLists: false,
      };

      const response = await trelloApi.post('/boards', boardData);
      testBoard = response.data;
      
      console.log(`✅ Board criado: ${testBoard.name} (${testBoard.id})`);
      
      expect(testBoard).toHaveProperty('id');
      expect(testBoard.name).toContain('Board de Teste Integração');
    });

    it('should create a list in the board', async () => {
      console.log('📝 Criando lista de teste...');
      const listData = {
        name: 'Lista de Teste ' + new Date().toISOString(),
        idBoard: testBoard.id,
      };

      const response = await trelloApi.post('/lists', listData);
      testList = response.data;
      
      console.log(`✅ Lista criada: ${testList.name} (${testList.id})`);
      
      expect(testList).toHaveProperty('id');
      expect(testList.name).toContain('Lista de Teste');
    });

    it('should create a card in the list', async () => {
      console.log('📝 Criando card de teste...');
      const cardData = {
        name: 'Card de Teste ' + new Date().toISOString(),
        desc: 'Descrição do card de teste',
        idList: testList.id,
        due: new Date(Date.now() + 86400000).toISOString(), // Amanhã
      };

      const response = await trelloApi.post('/cards', cardData);
      testCard = response.data;
      
      console.log(`✅ Card criado: ${testCard.name} (${testCard.id})`);
      
      expect(testCard).toHaveProperty('id');
      expect(testCard.name).toContain('Card de Teste');
    });

    it('should create a checklist in the card', async () => {
      console.log('📝 Criando checklist de teste...');
      const checklistData = {
        name: 'Checklist de Teste ' + new Date().toISOString(),
        idCard: testCard.id,
      };

      const response = await trelloApi.post('/checklists', checklistData);
      testChecklist = response.data;
      
      console.log(`✅ Checklist criado: ${testChecklist.name} (${testChecklist.id})`);
      
      expect(testChecklist).toHaveProperty('id');
      expect(testChecklist.name).toContain('Checklist de Teste');

      // Adicionar itens ao checklist
      console.log('📝 Adicionando itens ao checklist...');
      const items = ['Tarefa 1', 'Tarefa 2', 'Tarefa 3'];
      for (const item of items) {
        const itemResponse = await trelloApi.post(`/checklists/${testChecklist.id}/checkItems`, {
          name: item,
        });
        console.log(`✅ Item adicionado: ${itemResponse.data.name}`);
      }
    });

    it('should update card', async () => {
      console.log('📝 Atualizando card...');
      const updateData = {
        name: 'Card Atualizado ' + new Date().toISOString(),
        desc: 'Descrição atualizada do card de teste',
      };

      const response = await trelloApi.put(`/cards/${testCard.id}`, updateData);
      const updatedCard = response.data;
      
      console.log(`✅ Card atualizado: ${updatedCard.name}`);
      
      expect(updatedCard.name).toContain('Card Atualizado');
      expect(updatedCard.desc).toBe('Descrição atualizada do card de teste');
    });

    it('should add comment to card', async () => {
      console.log('📝 Adicionando comentário ao card...');
      const commentData = {
        text: 'Comentário de teste ' + new Date().toISOString(),
      };

      const response = await trelloApi.post(`/cards/${testCard.id}/actions/comments`, commentData);
      const comment = response.data;
      
      console.log(`✅ Comentário adicionado: ${comment.data.text}`);
      
      expect(comment.data.text).toContain('Comentário de teste');
    });

    it('should add label to card', async () => {
      console.log('📝 Adicionando label ao card...');
      const labelData = {
        name: 'Label de Teste',
        color: 'green',
        idBoard: testBoard.id,
      };

      // Criar label
      const labelResponse = await trelloApi.post('/labels', labelData);
      const label = labelResponse.data;
      
      // Adicionar label ao card
      await trelloApi.post(`/cards/${testCard.id}/idLabels`, {
        value: label.id,
      });
      
      console.log(`✅ Label adicionada: ${label.name}`);
      
      expect(label.name).toBe('Label de Teste');
      expect(label.color).toBe('green');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent board gracefully', async () => {
      console.log('🔍 Testando erro com board inexistente...');
      await expect(trelloApi.get('/boards/board-inexistente')).rejects.toMatchObject({
        response: {
          status: 400
        }
      });
    });

    it('should handle invalid card data gracefully', async () => {
      console.log('🔍 Testando erro com dados inválidos de card...');
      try {
        await trelloApi.post('/cards', {
          // Dados inválidos - faltando idList obrigatório
        });
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should handle rate limiting', async () => {
      console.log('🔍 Testando rate limiting...');
      try {
        // Fazer várias requisições em sequência
        await Promise.all(
          Array(100).fill(0).map(() => trelloApi.get('/boards/' + testBoard.id))
        );
      } catch (error) {
        if (error.response.status === 429) {
          console.log('✅ Rate limiting funcionando como esperado');
          expect(error.response.status).toBe(429);
        }
      }
    });
  });
}); 