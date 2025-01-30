import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega o arquivo .env do diretório raiz do projeto
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Verifica se as variáveis de ambiente necessárias estão definidas
const requiredEnvVars = ['TRELLO_API_KEY', 'TRELLO_TOKEN', 'ASANA_ACCESS_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Erro: Variável de ambiente ${envVar} não está definida`);
    process.exit(1);
  }
}

const trelloApi = axios.create({
  baseURL: 'https://api.trello.com/1',
  params: {
    key: process.env.TRELLO_API_KEY,
    token: process.env.TRELLO_TOKEN,
  },
});

const asanaApi = axios.create({
  baseURL: 'https://app.asana.com/api/1.0',
  headers: {
    'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Função de delay para evitar rate limits
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function cleanupTrelloBoards() {
  console.log('🧹 Limpando boards do Trello...');
  try {
    // Buscar todos os boards
    const response = await trelloApi.get('/members/me/boards');
    const boards = response.data;

    // Filtrar apenas os boards de teste
    const testBoards = boards.filter(board => 
      board.name.includes('Test') || 
      board.name.includes('Teste') || 
      board.name.includes('Integration') || 
      board.name.includes('Integração')
    );

    // Deletar cada board de teste com delay entre as chamadas
    for (const board of testBoards) {
      try {
        console.log(`  🗑️  Deletando board: ${board.name}`);
        await trelloApi.delete(`/boards/${board.id}`);
        console.log(`  ✅ Board removido: ${board.name}`);
        // Aguarda 1 segundo entre cada deleção para evitar rate limit
        await delay(1000);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log('  ⏳ Rate limit atingido, aguardando 10 segundos...');
          await delay(10000);
          // Tenta novamente
          await trelloApi.delete(`/boards/${board.id}`);
          console.log(`  ✅ Board removido após retry: ${board.name}`);
        } else {
          console.error(`  ❌ Erro ao remover board ${board.name}:`, error.message);
        }
      }
    }

    console.log(`✅ ${testBoards.length} boards removidos do Trello`);
  } catch (error) {
    console.error('❌ Erro ao limpar boards do Trello:', error.message);
  }
}

async function cleanupAsanaProjects() {
  console.log('🧹 Limpando projetos do Asana...');
  try {
    // Buscar todos os workspaces
    const workspacesResponse = await asanaApi.get('/workspaces');
    const workspaces = workspacesResponse.data.data;

    for (const workspace of workspaces) {
      try {
        // Buscar projetos do workspace
        const projectsResponse = await asanaApi.get(`/workspaces/${workspace.gid}/projects`);
        const projects = projectsResponse.data.data;

        // Filtrar apenas os projetos de teste
        const testProjects = projects.filter(project => 
          project.name.includes('Test') || 
          project.name.includes('Teste') || 
          project.name.includes('Integration') || 
          project.name.includes('Integração')
        );

        // Deletar cada projeto de teste com delay entre as chamadas
        for (const project of testProjects) {
          try {
            console.log(`  🗑️  Deletando projeto: ${project.name}`);
            await asanaApi.delete(`/projects/${project.gid}`);
            console.log(`  ✅ Projeto removido: ${project.name}`);
            // Aguarda 1 segundo entre cada deleção para evitar rate limit
            await delay(1000);
          } catch (error) {
            if (error.response?.status === 429) {
              console.log('  ⏳ Rate limit atingido, aguardando 10 segundos...');
              await delay(10000);
              // Tenta novamente
              await asanaApi.delete(`/projects/${project.gid}`);
              console.log(`  ✅ Projeto removido após retry: ${project.name}`);
            } else {
              console.error(`  ❌ Erro ao remover projeto ${project.name}:`, error.message);
            }
          }
        }

        console.log(`✅ ${testProjects.length} projetos removidos do workspace ${workspace.name}`);
      } catch (error) {
        console.error(`❌ Erro ao processar workspace ${workspace.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao limpar projetos do Asana:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando limpeza dos dados de teste...');
  
  // Executa as limpezas em sequência para evitar problemas de rate limit
  await cleanupTrelloBoards();
  await cleanupAsanaProjects();
  
  console.log('✨ Limpeza concluída!');
}

main().catch(console.error); 