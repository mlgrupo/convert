const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const axios = require('axios');
const { processarUrlGoogleDrive, isGoogleDriveUrl, uploadToGoogleDriveFolder } = require('../config/google-auth');
const { uploadFile, initializeStorage } = require('../config/storage');
const webhookLogger = require('../utils/webhook');
const transkriptorService = require('../services/transkriptor');

// Função para baixar arquivo de URL genérica
async function downloadFile(url) {
  try {
    console.log(`📥 Baixando arquivo de: ${url}`);
    
    // Gerar nome único para o arquivo temporário
    const timestamp = Date.now();
    const tempFileName = `temp_${timestamp}.mp4`;
    const tempPath = path.join(__dirname, '../temp', tempFileName);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Arquivo baixado: ${tempPath}`);
        resolve(tempPath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Erro ao baixar arquivo:', error.message);
    throw error;
  }
}

// Função para baixar vídeo do YouTube
async function downloadYouTubeVideo(url) {
  try {
    console.log(`📥 Baixando vídeo do YouTube: ${url}`);
    
    // Obter informações do vídeo primeiro
    const videoInfo = await ytdl.getInfo(url);
    const videoTitle = videoInfo.videoDetails.title;
    
    console.log(`📺 Título do vídeo: ${videoTitle}`);
    
    // Gerar nome único para o arquivo temporário
    const timestamp = Date.now();
    const safeTitle = generateSafeFileName(videoTitle) || `youtube_${timestamp}`;
    const tempFileName = `${safeTitle}.mp4`;
    const tempPath = path.join(__dirname, '../temp', tempFileName);
    
    const stream = ytdl(url, { quality: 'highestaudio' });
    const writer = fs.createWriteStream(tempPath);

    return new Promise((resolve, reject) => {
      stream.pipe(writer);
      writer.on('finish', () => {
        console.log(`✅ Vídeo do YouTube baixado: ${tempPath}`);
        // Retornar o caminho e o título
        resolve({ path: tempPath, title: videoTitle });
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Erro ao baixar vídeo do YouTube:', error.message);
    throw error;
  }
}

// Função para converter para M4A e remover silêncio
async function convertToM4aAndRemoveSilence(inputPath, outputPath) {
  try {
    console.log(`🔄 Convertendo para M4A e removendo silêncio...`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('aac')
        .audioFilters([
          'silenceremove=1:0:-50dB', // Remove silêncio
          'loudnorm=I=-16:TP=-1.5:LRA=11' // Normaliza áudio
        ])
        .format('mp4')
        .on('end', () => {
          console.log(`✅ Conversão concluída: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Erro na conversão:', err.message);
          reject(err);
        })
        .save(outputPath);
    });
  } catch (error) {
    console.error('❌ Erro ao converter arquivo:', error.message);
    throw error;
  }
}

// Função para extrair metadados do vídeo
async function extractVideoMetadata(inputPath) {
  try {
    console.log(`📋 Extraindo metadados do vídeo...`);
    
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.warn('⚠️ Erro ao extrair metadados, usando nome padrão:', err.message);
          resolve({ title: null });
          return;
        }
        
        // Tentar diferentes fontes para o título
        const title = metadata.format.tags?.title || 
                     metadata.format.tags?.filename ||
                     metadata.format.tags?.name ||
                     metadata.format.tags?.artist ||
                     path.basename(metadata.format.filename, path.extname(metadata.format.filename));
        
        console.log(`✅ Metadados extraídos: ${title || 'Nome padrão'}`);
        resolve({ title });
      });
    });
  } catch (error) {
    console.warn('⚠️ Erro ao extrair metadados:', error.message);
    return { title: null };
  }
}

// Função para gerar nome seguro do arquivo
function generateSafeFileName(originalName) {
  if (!originalName) return null;
  
  // Remover extensão se existir
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  // Remover caracteres especiais e espaços
  const safeName = nameWithoutExt
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_')     // Substitui espaços por underscore
    .replace(/_+/g, '_')      // Remove underscores duplicados
    .trim();
  
  return safeName || null;
}

// Função para extrair ID da pasta do Google Drive
function extrairIdPastaDrive(url) {
  if (!url) return null;
  
  // Padrões para pastas do Google Drive
  const folderPatterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,           // /folders/FOLDER_ID
    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9-_]+)/, // /drive/u/0/folders/FOLDER_ID
    /id=([a-zA-Z0-9-_]+)/,                   // ?id=FOLDER_ID
  ];
  
  for (const pattern of folderPatterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Inicializar armazenamento na inicialização do módulo
let storageInitialized = false;
async function ensureStorageInitialized() {
  if (!storageInitialized) {
    try {
      await initializeStorage();
      storageInitialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar armazenamento:', error.message);
      throw error;
    }
  }
}

// Função para limpar arquivos
async function cleanupFiles(files) {
  for (const file of files) {
    if (file && await fs.pathExists(file)) {
      try {
        await fs.remove(file);
        console.log(`🗑️ Arquivo removido: ${file}`);
      } catch (error) {
        console.error(`❌ Erro ao remover arquivo ${file}:`, error.message);
      }
    }
  }
}

// Rota principal para processar vídeo/áudio
router.post('/', async (req, res) => {
  const { link, pasta_drive, transkriptor } = req.body;
  
  if (!link) {
    return res.status(400).json({ 
      error: 'Link é obrigatório',
      example: {
        method: 'POST',
        url: '/api/video',
        body: { 
          link: 'https://drive.google.com/drive/folders/...',
          pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz', // opcional
          transkriptor: true // opcional - enviar para Transkriptor
        }
      }
    });
  }

  // Preparar informações do vídeo para logs
  const videoInfo = {
    link: link,
    id: Date.now().toString(),
    title: null,
    filename: null
  };

  console.log(`🎬 Processando link: ${link}`);
  if (pasta_drive) {
    console.log(`📁 Pasta do Drive especificada: ${pasta_drive}`);
  }
  if (transkriptor) {
    console.log(`📝 Transkriptor habilitado`);
  }
  
  let tempFilePath = null;
  let outputPath = null;
  const startTime = Date.now();
  
  try {
    // Log 1: Iniciando conversão
    await webhookLogger.logStart(videoInfo);
    
    // Inicializar armazenamento
    await ensureStorageInitialized();
    
    // Determinar tipo de link e baixar
    let downloadPath;
    let videoTitle = null;
    
    if (isGoogleDriveUrl(link)) {
      console.log('📁 Detectado link do Google Drive');
      const timestamp = Date.now();
      const tempFileName = `drive_${timestamp}.mp4`;
      const tempPath = path.join(__dirname, '../temp', tempFileName);
      const driveResult = await processarUrlGoogleDrive(link, tempPath);
      downloadPath = driveResult.path;
      videoTitle = driveResult.fileName;
    } else if (ytdl.validateURL(link)) {
      console.log('📺 Detectado link do YouTube');
      const youtubeResult = await downloadYouTubeVideo(link);
      downloadPath = youtubeResult.path;
      videoTitle = youtubeResult.title;
    } else {
      console.log('🌐 Detectado link genérico');
      downloadPath = await downloadFile(link);
    }
    
    if (!downloadPath) {
      throw new Error('Falha ao baixar o arquivo');
    }
    
    tempFilePath = downloadPath;
    console.log(`✅ Arquivo baixado: ${tempFilePath}`);
    
    // Atualizar informações do vídeo
    videoInfo.title = videoTitle;
    videoInfo.filename = path.basename(tempFilePath);
    
    // Extrair metadados do vídeo para obter o nome (se não foi extraído do YouTube ou Google Drive)
    if (!videoTitle) {
      const metadata = await extractVideoMetadata(tempFilePath);
      videoTitle = metadata.title;
      videoInfo.title = videoTitle;
    }
    
    const safeVideoTitle = generateSafeFileName(videoTitle);
    
    // Gerar nome do arquivo baseado no título do vídeo ou nome padrão
    const timestamp = Date.now();
    const baseFileName = safeVideoTitle || `audio_${timestamp}`;
    const outputFileName = `${baseFileName}.m4a`;
    outputPath = path.join(__dirname, '../temp', outputFileName);
    
    console.log(`📝 Nome do arquivo: ${outputFileName}`);
    console.log('🔄 Convertendo para M4A e removendo silêncio...');
    await convertToM4aAndRemoveSilence(tempFilePath, outputPath);
    console.log(`✅ Conversão concluída: ${outputPath}`);
    
    // Log 2: Conversão concluída
    const processingTime = Date.now() - startTime;
    await webhookLogger.logConversionComplete(videoInfo, processingTime);
    
    // Upload para armazenamento (apenas se não especificar pasta do Drive)
    let uploadResult = null;
    if (!pasta_drive) {
      console.log('📤 Fazendo upload para armazenamento local...');
      uploadResult = await uploadFile(outputPath, outputFileName);
    } else {
      console.log('📤 Pasta do Drive especificada, pulando upload local...');
    }
    
    // Upload para pasta do Google Drive (se especificado)
    let googleDriveUploadResult = null;
    if (pasta_drive) {
      console.log('📤 Fazendo upload para pasta do Google Drive...');
      
      let googleDriveFolderId = extrairIdPastaDrive(pasta_drive);
      if (!googleDriveFolderId) {
        console.warn('⚠️ Não foi possível extrair ID da pasta, usando pasta padrão');
        googleDriveFolderId = '1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz';
      }
      
      const uploadFileName = `${baseFileName}.m4a`;
      console.log(`📁 Usando pasta do Drive: ${googleDriveFolderId}`);
      console.log(`📝 Nome do arquivo para upload: ${uploadFileName}`);
      googleDriveUploadResult = await uploadToGoogleDriveFolder(outputPath, uploadFileName, googleDriveFolderId);
    }
    
    // Upload para Transkriptor (se habilitado)
    let transkriptorResult = null;
    if (transkriptor === true) {
      try {
        console.log('📤 Enviando áudio para Transkriptor...');
        transkriptorResult = await transkriptorService.uploadAudio(outputPath, outputFileName, 'pt-BR');
        
        // Log 3: Transkriptor enviado
        await webhookLogger.logTranskriptorSent(videoInfo, transkriptorResult);
        
      } catch (transkriptorError) {
        console.error('❌ Erro ao enviar para Transkriptor:', transkriptorError.message);
        await webhookLogger.logError(videoInfo, transkriptorError, {
          stage: 'transkriptor_upload',
          additionalInfo: 'Falha no upload para Transkriptor'
        });
        // Não falhar o processo principal se o Transkriptor falhar
      }
    }
    
    // Log 4: Upload completo
    await webhookLogger.logUploadComplete(videoInfo, {
      googleDrive: googleDriveUploadResult,
      transkriptor: transkriptorResult,
      local: uploadResult
    });
    
    // Limpar arquivos temporários
    await cleanupFiles([tempFilePath, outputPath]);
    
    // Retornar resposta com link de download
    res.json({
      success: true,
      message: pasta_drive ? 'Áudio processado e enviado para Google Drive!' : 'Áudio processado com sucesso!',
      storage: {
        type: pasta_drive ? 'google_drive' : 'local',
        description: pasta_drive ? 'Arquivo enviado para Google Drive' : 'Arquivo disponível para download local'
      },
      file: {
        originalName: pasta_drive ? `${baseFileName}.m4a` : outputFileName,
        fileName: uploadResult ? uploadResult.fileName : null,
        size: uploadResult ? uploadResult.size : null,
        downloadUrl: uploadResult ? uploadResult.downloadUrl : null,
        bucket: uploadResult ? uploadResult.bucket : null,
        expiresIn: uploadResult ? '24 horas' : null
      },
      googleDrive: googleDriveUploadResult ? {
        fileId: googleDriveUploadResult.fileId,
        fileName: googleDriveUploadResult.fileName,
        fileSize: googleDriveUploadResult.fileSize,
        webViewLink: googleDriveUploadResult.webViewLink,
        folderId: googleDriveUploadResult.folderId,
        pastaEspecificada: !!pasta_drive,
        pastaUrl: pasta_drive || 'Pasta padrão'
      } : null,
      transkriptor: transkriptorResult ? {
        fileId: transkriptorResult.fileId,
        status: transkriptorResult.status,
        fileName: transkriptorResult.fileName,
        language: transkriptorResult.language,
        webhookUrl: transkriptorResult.webhookUrl
      } : null,
      processing: {
        silenceRemoved: true,
        format: 'M4A',
        normalized: true,
        videoTitle: videoTitle || 'Nome padrão',
        processingTime: `${processingTime}ms`
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no processamento:', error.message);
    
    // Log de erro
    await webhookLogger.logError(videoInfo, error, {
      stage: 'processing',
      additionalInfo: 'Erro durante processamento principal'
    });
    
    // Limpar arquivos em caso de erro
    await cleanupFiles([tempFilePath, outputPath]);
    
    res.status(500).json({
      error: 'Erro no processamento do vídeo/áudio',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para verificar status do Transkriptor
router.get('/transkriptor/status/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const transkriptorService = require('../services/transkriptor');
    const status = await transkriptorService.getFileStatus(orderId);
    
    res.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
    res.status(500).json({
      error: 'Erro ao verificar status do Transkriptor',
      details: error.message
    });
  }
});

// Rota para listar todos os arquivos do Transkriptor
router.get('/transkriptor/files', async (req, res) => {
  try {
    const transkriptorService = require('../services/transkriptor');
    const files = await transkriptorService.listAllFiles();
    
    res.json({
      success: true,
      files: files
    });

  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error.message);
    res.status(500).json({
      error: 'Erro ao listar arquivos do Transkriptor',
      details: error.message
    });
  }
});

// Rota para download do arquivo processado
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Verificar se o arquivo existe
    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      return res.status(404).json({
        error: 'Arquivo não encontrado',
        message: 'O arquivo solicitado não existe ou foi removido'
      });
    }

    // Configurar headers para download
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Enviar arquivo como stream
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Limpar arquivo após 24 horas (opcional)
    setTimeout(async () => {
      try {
        await fs.remove(filePath);
        console.log(`🧹 Arquivo expirado removido: ${filename}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao remover arquivo expirado: ${error.message}`);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

  } catch (error) {
    console.error('❌ Erro no download:', error.message);
    res.status(500).json({
      error: 'Erro no download',
      message: error.message
    });
  }
});

// Rota para status da API
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    features: {
      googleDrive: 'Suportado (arquivos e pastas)',
      youtube: 'Suportado',
      genericUrls: 'Suportado',
      audioProcessing: 'Conversão para M4A + Remoção de silêncio + Normalização',
      storage: 'Armazenamento local com links de download',
      downloadLinks: 'Links temporários de 24 horas',
      autoUpload: 'Upload condicional: local (sem pasta_drive) ou Google Drive (com pasta_drive)'
    },
    endpoints: {
      process: 'POST /api/video',
      download: 'GET /api/video/download/:filename',
      status: 'GET /api/video/status'
    }
  });
});

module.exports = router; 