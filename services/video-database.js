const fs = require('fs-extra');
const path = require('path');

class VideoDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/processed-videos.json');
    this.data = null;
  }

  // Carregar dados do banco
  async loadDatabase() {
    try {
      if (!await fs.pathExists(this.dbPath)) {
        // Criar diretório se não existir
        await fs.ensureDir(path.dirname(this.dbPath));
        
        // Criar arquivo inicial
        const initialData = {
          processed_videos: [],
          metadata: {
            total_processed: 0,
            last_updated: new Date().toISOString(),
            version: "1.0"
          }
        };
        
        await fs.writeJson(this.dbPath, initialData, { spaces: 2 });
        this.data = initialData;
        console.log('📁 Banco de dados JSON criado');
      } else {
        this.data = await fs.readJson(this.dbPath);
        console.log('📁 Banco de dados JSON carregado');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar banco de dados:', error.message);
      throw error;
    }
  }

  // Salvar dados no banco
  async saveDatabase() {
    try {
      this.data.metadata.last_updated = new Date().toISOString();
      this.data.metadata.total_processed = this.data.processed_videos.length;
      
      await fs.writeJson(this.dbPath, this.data, { spaces: 2 });
      console.log('💾 Banco de dados salvo');
    } catch (error) {
      console.error('❌ Erro ao salvar banco de dados:', error.message);
      throw error;
    }
  }

  // Extrair ID do Google Drive da URL
  extractGoogleDriveId(url) {
    if (!url) return null;
    
    // Padrões para extrair ID do Google Drive
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,           // /file/d/FILE_ID
      /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9-_]+)/, // /drive/u/0/folders/FOLDER_ID
      /id=([a-zA-Z0-9-_]+)/,                   // ?id=FILE_ID
      /\/d\/([a-zA-Z0-9-_]+)/,                 // /d/FILE_ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  // Verificar se vídeo já foi processado
  isVideoProcessed(link) {
    if (!this.data) return false;
    
    const driveId = this.extractGoogleDriveId(link);
    if (!driveId) return false;
    
    const processed = this.data.processed_videos.find(video => video.id === driveId);
    return processed !== undefined;
  }

  // Obter informações do vídeo processado
  getProcessedVideo(link) {
    if (!this.data) return null;
    
    const driveId = this.extractGoogleDriveId(link);
    if (!driveId) return null;
    
    return this.data.processed_videos.find(video => video.id === driveId) || null;
  }

  // Adicionar vídeo processado
  async addProcessedVideo(link, title, transkriptorId = null, fileName = null) {
    if (!this.data) {
      await this.loadDatabase();
    }
    
    const driveId = this.extractGoogleDriveId(link);
    if (!driveId) {
      throw new Error('Não foi possível extrair ID do Google Drive da URL');
    }
    
    // Verificar se já existe
    const existingIndex = this.data.processed_videos.findIndex(video => video.id === driveId);
    
    const videoData = {
      id: driveId,
      link: link,
      title: title || '',
      processed_at: new Date().toISOString(),
      transkriptor_id: transkriptorId || '',
      status: 'processed',
      file_name: fileName || ''
    };
    
    if (existingIndex >= 0) {
      // Atualizar existente
      this.data.processed_videos[existingIndex] = videoData;
      console.log(`🔄 Vídeo atualizado no banco: ${driveId}`);
    } else {
      // Adicionar novo
      this.data.processed_videos.push(videoData);
      console.log(`➕ Vídeo adicionado ao banco: ${driveId}`);
    }
    
    await this.saveDatabase();
    return videoData;
  }

  // Listar todos os vídeos processados
  getAllProcessedVideos() {
    if (!this.data) return [];
    return this.data.processed_videos;
  }

  // Buscar vídeo por ID
  getVideoById(id) {
    if (!this.data) return null;
    return this.data.processed_videos.find(video => video.id === id) || null;
  }

  // Remover vídeo do banco
  async removeVideo(id) {
    if (!this.data) return false;
    
    const index = this.data.processed_videos.findIndex(video => video.id === id);
    if (index >= 0) {
      this.data.processed_videos.splice(index, 1);
      await this.saveDatabase();
      console.log(`🗑️ Vídeo removido do banco: ${id}`);
      return true;
    }
    
    return false;
  }

  // Obter estatísticas
  getStats() {
    if (!this.data) return null;
    
    return {
      total_processed: this.data.processed_videos.length,
      last_updated: this.data.metadata.last_updated,
      with_transkriptor: this.data.processed_videos.filter(v => v.transkriptor_id).length,
      without_transkriptor: this.data.processed_videos.filter(v => !v.transkriptor_id).length
    };
  }

  // Verificar se ID está na lista pré-definida
  isPredefinedId(id) {
    const predefinedIds = [
      '1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P',
      '1VRkdbMtF3vgEkIl1dwdBVlZdMtGkwydf',
      '1PG3WMvaXSVD0wrIXihNccwG0zTgXXCVx',
      '17o093NBiVZY3jcw5BHgR0S0_7o_6AwvZ',
      '15fyqHfAoytHnFe64euzBVWAraeErIGnZ',
      '1IWs9uWwhI6RRzYfIAhOm-4TWsCEFmJTG',
      '14dBt04E0Aw99EJz3o931y1ckesnCbLlo',
      '1wPX-4psAWFRA9nytV9HYrchObqI2nmYM',
      '12jWFsZiRqWAaW_6hX45oMo4CzRDbZLOC',
      '1mjRa9HBu4onJY2IojObjWezObOnfZncm',
      '1xSVrHf86r5dSEwW8gy5r_L-j3fGLfRJd',
      '1zTAWEtIPpho5KGt14bJQFONaJgazHKZl',
      '19NgVfjEZl7VX0otiwKuIn6RSy0S9SZht',
      '1ih3wY2bShULlGP5-UY1W_F4W3nGYIDsX'
    ];
    
    return predefinedIds.includes(id);
  }
}

// Instância singleton
const videoDatabase = new VideoDatabase();

module.exports = videoDatabase; 