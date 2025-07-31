const axios = require('axios');
const fs = require('fs');

class TranskriptorService {
  constructor() {
    this.apiKey = process.env.ACCESS_TOKEN_TRANSKRIPTOR;
    this.baseUrl = 'https://api.tor.app/developer/transcription';
    this.webhookUrl = 'https://automacoes.reconectaoficial.com/webhook/transkriptor-callback';
  }

  async uploadAudio(audioFilePath, fileName, language = 'pt-BR') {
    try {
      console.log(`📤 Enviando áudio para Transkriptor: ${fileName}`);

      if (!this.apiKey) {
        throw new Error('ACCESS_TOKEN_TRANSKRIPTOR não configurado');
      }

      // Verificar se o arquivo existe
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Arquivo não encontrado: ${audioFilePath}`);
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      };

      // Step 1: Obter URL de upload
      console.log('🔗 Obtendo URL de upload...');
      const uploadUrlResponse = await axios.post(
        `${this.baseUrl}/local_file/get_upload_url`,
        { file_name: fileName },
        { headers }
      );

      if (uploadUrlResponse.status !== 200) {
        throw new Error(`Falha ao obter URL de upload: ${uploadUrlResponse.status}`);
      }

      const { upload_url, public_url } = uploadUrlResponse.data;
      console.log('✅ URL de upload obtida');

      // Step 2: Fazer upload do arquivo
      console.log('📤 Fazendo upload do arquivo...');
      const fileBuffer = fs.readFileSync(audioFilePath);
      const uploadResponse = await axios.put(upload_url, fileBuffer, {
        timeout: 120000, // 2 minutos para upload
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'audio/mp4'
        }
      });

      if (uploadResponse.status !== 200) {
        throw new Error(`Falha no upload: ${uploadResponse.status}`);
      }

      console.log('✅ Arquivo enviado com sucesso');

      // Step 3: Iniciar transcrição
      console.log('🎤 Iniciando transcrição...');
      const transcriptionResponse = await axios.post(
        `${this.baseUrl}/local_file/initiate_transcription`,
        {
          url: public_url,
          language: language,
          service: 'Standard'
        },
        { headers }
      );

      if (transcriptionResponse.status !== 202) {
        throw new Error(`Falha ao iniciar transcrição: ${transcriptionResponse.status}`);
      }

      const { order_id, message } = transcriptionResponse.data;
      console.log(`✅ Transcrição iniciada: ${message}`);
      console.log(`📋 Order ID: ${order_id}`);

      return {
        success: true,
        fileId: order_id,
        status: 'processing',
        fileName: fileName,
        language: language,
        webhookUrl: this.webhookUrl,
        message: message
      };

    } catch (error) {
      console.error('❌ Erro ao enviar áudio para Transkriptor:', error.message);
      
      if (error.response) {
        console.error('📋 Resposta do Transkriptor:', error.response.data);
        throw new Error(`Transkriptor API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`Erro ao enviar para Transkriptor: ${error.message}`);
    }
  }

  async getFileStatus(fileId) {
    try {
      if (!this.apiKey) {
        throw new Error('ACCESS_TOKEN_TRANSKRIPTOR não configurado');
      }

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      };

      const response = await axios.get(`${this.baseUrl}/get_file_detail`, {
        headers,
        params: { order_id: fileId },
        timeout: 30000
      });

      return {
        success: true,
        fileId: response.data.order_id,
        status: response.data.status,
        progress: response.data.progress,
        result: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao obter status do arquivo:', error.message);
      throw new Error(`Erro ao obter status: ${error.message}`);
    }
  }

  async downloadTranscript(fileId) {
    try {
      if (!this.apiKey) {
        throw new Error('ACCESS_TOKEN_TRANSKRIPTOR não configurado');
      }

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      };

      const response = await axios.get(`${this.baseUrl}/get_file_content`, {
        headers,
        params: { order_id: fileId },
        timeout: 30000
      });

      return {
        success: true,
        fileId: fileId,
        transcript: response.data.transcript,
        format: response.data.format
      };

    } catch (error) {
      console.error('❌ Erro ao baixar transcrição:', error.message);
      throw new Error(`Erro ao baixar transcrição: ${error.message}`);
    }
  }

  async listAllFiles() {
    try {
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

      return {
        success: true,
        files: response.data.files || []
      };

    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error.message);
      throw new Error(`Erro ao listar arquivos: ${error.message}`);
    }
  }
}

module.exports = new TranskriptorService(); 