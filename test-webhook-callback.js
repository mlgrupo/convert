require('dotenv').config();
const express = require('express');
const axios = require('axios');

class WebhookTester {
  constructor() {
    this.app = express();
    this.port = 3001;
    this.webhookUrl = 'https://automacoes.reconectaoficial.com/webhook/transkriptor-callback';
    this.receivedWebhooks = [];
    
    this.setupServer();
  }

  setupServer() {
    // Middleware para parsear JSON
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Rota para receber webhooks
    this.app.post('/webhook/transkriptor-callback', (req, res) => {
      console.log('📡 Webhook recebido!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));
      console.log('📋 Body:', JSON.stringify(req.body, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Salvar webhook recebido
      this.receivedWebhooks.push({
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: req.body
      });

      res.status(200).json({ 
        success: true, 
        message: 'Webhook recebido com sucesso',
        timestamp: new Date().toISOString()
      });
    });

    // Rota para verificar webhooks recebidos
    this.app.get('/webhooks', (req, res) => {
      res.json({
        total: this.receivedWebhooks.length,
        webhooks: this.receivedWebhooks
      });
    });

    // Rota para limpar webhooks
    this.app.delete('/webhooks', (req, res) => {
      this.receivedWebhooks = [];
      res.json({ message: 'Webhooks limpos' });
    });

    // Rota principal
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Webhook Tester ativo',
        endpoints: {
          'POST /webhook/transkriptor-callback': 'Receber webhooks do Transkriptor',
          'GET /webhooks': 'Ver webhooks recebidos',
          'DELETE /webhooks': 'Limpar webhooks'
        },
        webhooksReceived: this.receivedWebhooks.length
      });
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Webhook Tester iniciado na porta ${this.port}`);
        console.log(`📡 Aguardando webhooks em: http://localhost:${this.port}/webhook/transkriptor-callback`);
        console.log(`📋 Ver webhooks: http://localhost:${this.port}/webhooks`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 Webhook Tester parado');
    }
  }

  async testWebhook() {
    try {
      console.log('🧪 Testando envio de webhook...\n');

      const testPayload = {
        order_id: 'test_123456789',
        status: 'completed',
        file_name: 'test_audio.m4a',
        language: 'pt-BR',
        transcript: 'Esta é uma transcrição de teste para verificar se o webhook está funcionando corretamente.',
        duration: '00:01:30',
        word_count: 15,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      console.log('📤 Enviando webhook de teste...');
      console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));

      const response = await axios.post(this.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Transkriptor-Webhook-Test/1.0'
        },
        timeout: 10000
      });

      console.log('✅ Webhook enviado com sucesso!');
      console.log('📊 Status:', response.status);
      console.log('📋 Resposta:', response.data);

    } catch (error) {
      console.error('❌ Erro ao enviar webhook de teste:');
      
      if (error.response) {
        console.error('📊 Status:', error.response.status);
        console.error('📋 Resposta:', error.response.data);
      } else {
        console.error('🌐 Erro de rede:', error.message);
      }
    }
  }

  getWebhooks() {
    return this.receivedWebhooks;
  }

  clearWebhooks() {
    this.receivedWebhooks = [];
  }
}

// Função principal
async function main() {
  const tester = new WebhookTester();
  
  try {
    await tester.start();

    // Aguardar webhooks por 5 minutos
    console.log('⏰ Aguardando webhooks por 5 minutos...');
    console.log('🔄 Pressione Ctrl+C para parar\n');

    // Testar webhook após 2 segundos
    setTimeout(async () => {
      await tester.testWebhook();
    }, 2000);

    // Mostrar webhooks recebidos a cada 30 segundos
    const interval = setInterval(() => {
      const webhooks = tester.getWebhooks();
      if (webhooks.length > 0) {
        console.log(`📡 Webhooks recebidos até agora: ${webhooks.length}`);
      }
    }, 30000);

    // Parar após 5 minutos
    setTimeout(async () => {
      clearInterval(interval);
      console.log('\n⏰ Tempo esgotado. Parando webhook tester...');
      
      const webhooks = tester.getWebhooks();
      console.log(`📊 Total de webhooks recebidos: ${webhooks.length}`);
      
      if (webhooks.length > 0) {
        console.log('\n📋 Último webhook recebido:');
        console.log(JSON.stringify(webhooks[webhooks.length - 1], null, 2));
      }
      
      await tester.stop();
      process.exit(0);
    }, 300000); // 5 minutos

  } catch (error) {
    console.error('❌ Erro:', error);
    await tester.stop();
    process.exit(1);
  }
}

// Capturar Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n🛑 Parando webhook tester...');
  process.exit(0);
});

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WebhookTester; 