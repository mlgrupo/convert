require('dotenv').config();
const axios = require('axios');

class TranskriptorStatusChecker {
  constructor() {
    this.apiKey = process.env.ACCESS_TOKEN_TRANSKRIPTOR;
    this.baseUrl = 'https://api.tor.app/developer/transcription';
  }

  async checkFileStatus(orderId) {
    try {
      console.log(`🔍 Verificando status do arquivo: ${orderId}\n`);

      if (!this.apiKey) {
        throw new Error('ACCESS_TOKEN_TRANSKRIPTOR não configurado');
      }

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      };

      // Verificar detalhes do arquivo
      const response = await axios.get(`${this.baseUrl}/get_file_detail`, {
        headers,
        params: { order_id: orderId },
        timeout: 30000
      });

      const fileData = response.data;
      
      console.log('📊 Status do Arquivo:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Order ID: ${fileData.order_id}`);
      console.log(`📝 Nome: ${fileData.file_name || 'N/A'}`);
      console.log(`🔄 Status: ${fileData.status}`);
      console.log(`📈 Progresso: ${fileData.progress || 'N/A'}%`);
      console.log(`🌐 Idioma: ${fileData.language || 'N/A'}`);
      console.log(`📅 Criado em: ${fileData.created_at || 'N/A'}`);
      console.log(`⏰ Atualizado em: ${fileData.updated_at || 'N/A'}`);
      
      if (fileData.status === 'completed') {
        console.log(`✅ Concluído em: ${fileData.completed_at || 'N/A'}`);
      }

      // Se estiver concluído, buscar o conteúdo
      if (fileData.status === 'completed') {
        console.log('\n📄 Buscando transcrição...');
        const transcriptResponse = await axios.get(`${this.baseUrl}/get_file_content`, {
          headers,
          params: { order_id: orderId },
          timeout: 30000
        });

        const transcriptData = transcriptResponse.data;
        console.log('📝 Transcrição:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(transcriptData.transcript || 'Transcrição não disponível');
        console.log(`📊 Duração: ${transcriptData.duration || 'N/A'}`);
        console.log(`🔤 Palavras: ${transcriptData.word_count || 'N/A'}`);
      }

      return {
        success: true,
        fileData: fileData,
        transcript: fileData.status === 'completed' ? transcriptData : null
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status:', error.message);
      
      if (error.response) {
        console.error('📊 Status:', error.response.status);
        console.error('📋 Resposta:', error.response.data);
      }
      
      throw error;
    }
  }

  async listAllFiles() {
    try {
      console.log('📋 Listando todos os arquivos...\n');

      if (!this.apiKey) {
        throw new Error('ACCESS_TOKEN_TRANSKRIPTOR não configurado');
      }

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      };

      const response = await axios.get(`${this.baseUrl}/get_files`, {
        headers,
        timeout: 30000
      });

      const files = response.data.files || [];
      
      console.log(`📊 Total de arquivos: ${files.length}\n`);
      
      if (files.length === 0) {
        console.log('📭 Nenhum arquivo encontrado');
        return;
      }

      files.forEach((file, index) => {
        console.log(`${index + 1}. 📋 Order ID: ${file.order_id}`);
        console.log(`   📝 Nome: ${file.file_name || 'N/A'}`);
        console.log(`   🔄 Status: ${file.status}`);
        console.log(`   📈 Progresso: ${file.progress || 'N/A'}%`);
        console.log(`   📅 Criado: ${file.created_at || 'N/A'}`);
        console.log('   ──────────────────────────────────────────');
      });

      return files;

    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error.message);
      throw error;
    }
  }
}

// Função principal
async function main() {
  const checker = new TranskriptorStatusChecker();
  
  // Verificar se foi passado um order_id como argumento
  const orderId = process.argv[2];
  
  if (orderId) {
    // Verificar arquivo específico
    await checker.checkFileStatus(orderId);
  } else {
    // Listar todos os arquivos
    await checker.listAllFiles();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TranskriptorStatusChecker; 