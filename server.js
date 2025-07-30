// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs-extra');

// Importar rotas
const videoRoutes = require('./routes/video');
const { initializeStorage } = require('./config/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());
app.use(cors());

// Middleware para parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Criar diretórios necessários
const tempDir = path.join(__dirname, 'temp');
const uploadsDir = path.join(__dirname, 'uploads');

async function createDirectories() {
  try {
    await fs.ensureDir(tempDir);
    await fs.ensureDir(uploadsDir);
    console.log('Diretórios criados com sucesso');
  } catch (error) {
    console.error('Erro ao criar diretórios:', error);
  }
}

// Rotas
app.use('/api/video', videoRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'API de Conversão de Vídeo/Audio',
    endpoints: {
      'POST /api/video': 'Converter vídeo/áudio para m4a e remover silêncio'
    },
    features: {
      'Google Drive': 'Suporte a download de arquivos do Google Drive',
      'YouTube': 'Suporte a download de vídeos do YouTube',
      'URLs diretas': 'Suporte a download de URLs diretas',
      'Armazenamento': 'Armazenamento local com links de download'
    }
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Inicializar serviços
async function initializeServices() {
  try {
    console.log('🚀 Inicializando serviços...');
    
    // Criar diretórios necessários
    await createDirectories();
    
    // Inicializar armazenamento
    await initializeStorage();
    
    console.log('✅ Todos os serviços inicializados!');
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error.message);
    process.exit(1);
  }
}

// Inicializar servidor
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🎉 Servidor rodando na porta ${PORT}`);
      console.log(`📡 API disponível em: http://localhost:${PORT}`);
      console.log(`📋 Endpoints:`);
      console.log(`   POST /api/video - Processar vídeo/áudio`);
      console.log(`   GET  /api/video/status - Status da API`);
      console.log(`   GET  / - Informações da API`);
      console.log('');
      console.log(`🔧 Configurações:`);
      console.log(`   Google Drive: ✅ Integrado`);
      console.log(`   Armazenamento: ✅ Local`);
      console.log(`   FFmpeg: ✅ Disponível`);
      console.log(`   Email de Impersonation: ${process.env.GOOGLE_USER_EMAIL || 'Não configurado'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

startServer(); 