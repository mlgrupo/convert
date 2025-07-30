const fs = require('fs-extra');
const path = require('path');

// Configuração de armazenamento local
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Inicializar sistema de armazenamento
 */
async function initializeStorage() {
  try {
    console.log('🔧 Inicializando sistema de armazenamento...');
    
    // Criar diretório de uploads se não existir
    await fs.ensureDir(UPLOADS_DIR);
    console.log(`   Diretório: ${UPLOADS_DIR}`);
    console.log(`   URL Base: ${BASE_URL}`);
    
    console.log('✅ Sistema de armazenamento inicializado!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar armazenamento:', error.message);
    throw error;
  }
}

/**
 * Upload de arquivo para armazenamento local
 */
async function uploadFile(filePath, fileName) {
  try {
    console.log(`📤 Fazendo upload: ${fileName}`);
    
    // Verificar se o arquivo existe
    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Obter estatísticas do arquivo
    const stats = await fs.stat(filePath);
    console.log(`   Tamanho do arquivo: ${stats.size} bytes`);
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const destinationPath = path.join(UPLOADS_DIR, uniqueFileName);
    
    // Copiar arquivo para uploads
    await fs.copy(filePath, destinationPath);
    console.log(`✅ Upload concluído: ${uniqueFileName}`);
    
    // Gerar URL de download
    const downloadUrl = `${BASE_URL}/api/video/download/${uniqueFileName}`;
    
    return {
      fileName: uniqueFileName,
      originalName: fileName,
      downloadUrl: downloadUrl,
      bucket: 'local',
      size: stats.size,
      localPath: destinationPath
    };
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    throw error;
  }
}

/**
 * Deletar arquivo do armazenamento
 */
async function deleteFile(fileName) {
  try {
    console.log(`🗑️ Deletando arquivo: ${fileName}`);
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    const fileExists = await fs.pathExists(filePath);
    if (fileExists) {
      await fs.remove(filePath);
      console.log(`✅ Arquivo deletado: ${fileName}`);
    } else {
      console.log(`⚠️ Arquivo não encontrado: ${fileName}`);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error.message);
    throw error;
  }
}

/**
 * Listar arquivos no armazenamento
 */
async function listFiles(prefix = '') {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const fileList = [];
    
    for (const file of files) {
      if (file.startsWith(prefix)) {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = await fs.stat(filePath);
        
        fileList.push({
          name: file,
          size: stats.size,
          lastModified: stats.mtime
        });
      }
    }
    
    return fileList;
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error.message);
    throw error;
  }
}

/**
 * Verificar se arquivo existe
 */
async function fileExists(fileName) {
  try {
    const filePath = path.join(UPLOADS_DIR, fileName);
    return await fs.pathExists(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Obter informações do arquivo
 */
async function getFileInfo(fileName) {
  try {
    const filePath = path.join(UPLOADS_DIR, fileName);
    const stats = await fs.stat(filePath);
    
    return {
      name: fileName,
      size: stats.size,
      lastModified: stats.mtime,
      localPath: filePath
    };
  } catch (error) {
    console.error('❌ Erro ao obter informações do arquivo:', error.message);
    throw error;
  }
}

/**
 * Limpar arquivos antigos (mais de 24 horas)
 */
async function cleanupOldFiles() {
  try {
    console.log('🧹 Limpando arquivos antigos...');
    const files = await fs.readdir(UPLOADS_DIR);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 horas em ms
    
    let cleanedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > oneDay) {
        await fs.remove(filePath);
        console.log(`   🗑️ Removido: ${file}`);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ ${cleanedCount} arquivos antigos removidos`);
    } else {
      console.log('✅ Nenhum arquivo antigo encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar arquivos:', error.message);
  }
}

module.exports = {
  UPLOADS_DIR,
  initializeStorage,
  uploadFile,
  deleteFile,
  listFiles,
  fileExists,
  getFileInfo,
  cleanupOldFiles
}; 