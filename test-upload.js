require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function testUpload() {
  console.log('🧪 Testando upload para Transkriptor...\n');
  
  const token = process.env.ACCESS_TOKEN_TRANSKRIPTOR;
  
  if (!token) {
    console.log('❌ ACCESS_TOKEN_TRANSKRIPTOR não configurado!');
    return;
  }
  
  console.log('✅ Token encontrado:', token.substring(0, 10) + '...');
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    // Step 1: Obter URL de upload
    console.log('🔗 Obtendo URL de upload...');
    const uploadUrlResponse = await axios.post(
      'https://api.tor.app/developer/transcription/local_file/get_upload_url',
      { file_name: 'test_audio.m4a' },
      { headers }
    );

    if (uploadUrlResponse.status !== 200) {
      throw new Error(`Falha ao obter URL de upload: ${uploadUrlResponse.status}`);
    }

    const { upload_url, public_url } = uploadUrlResponse.data;
    console.log('✅ URL de upload obtida');
    console.log('📋 Upload URL:', upload_url);
    console.log('📋 Public URL:', public_url);

    // Step 2: Criar arquivo de teste
    console.log('📝 Criando arquivo de teste...');
    const testFilePath = './test_audio.m4a';
    const testData = Buffer.from('fake audio data for testing');
    fs.writeFileSync(testFilePath, testData);
    console.log('✅ Arquivo de teste criado');

    // Step 3: Fazer upload do arquivo
    console.log('📤 Fazendo upload do arquivo...');
    const fileBuffer = fs.readFileSync(testFilePath);
    const uploadResponse = await axios.put(upload_url, fileBuffer, {
      timeout: 120000,
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

    // Step 4: Iniciar transcrição
    console.log('🎤 Iniciando transcrição...');
    const transcriptionResponse = await axios.post(
      'https://api.tor.app/developer/transcription/local_file/initiate_transcription',
      {
        url: public_url,
        language: 'pt-BR',
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

    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    console.log('🧹 Arquivo de teste removido');

  } catch (error) {
    console.log('❌ Erro no teste:');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Resposta:', error.response.data);
    } else {
      console.log('🌐 Erro de rede:', error.message);
    }
  }
}

testUpload(); 