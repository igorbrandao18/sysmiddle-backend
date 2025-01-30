import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAPIs() {
  console.log('🔍 Testando conexões com as APIs...\n');

  // Teste Trello
  try {
    const trelloResponse = await axios.get(
      `https://api.trello.com/1/members/me/boards?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`
    );
    console.log('✅ Conexão com Trello bem sucedida!');
    console.log(`📋 Número de quadros encontrados: ${trelloResponse.data.length}\n`);
  } catch (error) {
    console.error('❌ Erro ao conectar com Trello:', error.response?.data || error.message);
  }

  // Teste Asana
  try {
    const asanaResponse = await axios.get('https://app.asana.com/api/1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`
      }
    });
    console.log('✅ Conexão com Asana bem sucedida!');
    console.log(`👤 Usuário Asana: ${asanaResponse.data.data.name}\n`);
  } catch (error) {
    console.error('❌ Erro ao conectar com Asana:', error.response?.data || error.message);
  }
}

testAPIs(); 