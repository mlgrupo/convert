const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { uploadFile, initializeStorage } = require('../config/storage');
const webhookLogger = require('../utils/webhook');
const transkriptorService = require('../services/transkriptor');
const videoDatabase = require('../services/video-database');
const videoQueue = require('../services/video-queue');
const {
  downloadFile,
  downloadYouTubeVideo,
           convertToMp3AndRemoveSilence,
  extractVideoMetadata,
  generateSafeFileName,
  extrairIdPastaDrive,
  cleanupFiles,
  ensureStorageInitialized,
  uploadToGoogleDriveFolder,
  processarUrlGoogleDrive,
  isGoogleDriveUrl,
  logWithTimestamp,
  logError,
  logSuccess,
  logProgress
} = require('../services/video-processing-utils');











// Rota principal para processar vídeo/áudio
router.post('/', async (req, res) => {
  const requestId = Date.now().toString();
  logWithTimestamp(`[${requestId}] Nova requisição recebida`, '🚀');
  
  const { link, pasta_drive, transkriptor, use_queue = true } = req.body;
  
  logWithTimestamp(`[${requestId}] Parâmetros: link=${link ? 'Sim' : 'Não'}, pasta_drive=${pasta_drive ? 'Sim' : 'Não'}, transkriptor=${transkriptor}, use_queue=${use_queue}`, '📋');
  
  if (!link) {
    logWithTimestamp(`[${requestId}] Erro: Link não fornecido`, '❌');
    return res.status(400).json({ 
      error: 'Link é obrigatório',
      example: {
        method: 'POST',
        url: '/api/video',
        body: { 
          link: 'https://drive.google.com/drive/folders/...',
          pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz', // opcional
          transkriptor: true, // opcional - enviar para Transkriptor
          use_queue: true // opcional - usar sistema de fila (padrão: true)
        }
      }
    });
  }

  // Inicializar banco de dados
  try {
    logWithTimestamp(`[${requestId}] Inicializando banco de dados...`, '💾');
    await videoDatabase.loadDatabase();
    logSuccess(`[${requestId}] Banco de dados inicializado`);
  } catch (error) {
    logError(`[${requestId}] Erro ao inicializar banco de dados`, error);
    return res.status(500).json({
      error: 'Erro ao inicializar banco de dados',
      details: error.message
    });
  }

  // Se use_queue for false, processa diretamente (comportamento antigo)
  if (use_queue === false) {
    logWithTimestamp(`[${requestId}] Processamento direto solicitado`, '⚡');
    return await processVideoDirectly(req, res);
  }

  // Usar sistema de fila
  logWithTimestamp(`[${requestId}] Adicionando vídeo à fila: ${link}`, '📥');
  
  const queueResult = await videoQueue.addToQueue({
    link,
    title: null, // Será definido durante o processamento
    options: { pasta_drive, transkriptor }, // Passar opções para o processamento
    callback: (result) => {
      // Este callback será chamado quando o processamento terminar
      logWithTimestamp(`[${requestId}] Callback da fila executado para: ${link}`, '🎯');
    }
  });

  if (!queueResult.added) {
    if (queueResult.reason === 'already_processed') {
      return res.json({
        success: true,
        message: 'Vídeo já foi processado anteriormente!',
        already_processed: true,
        video_info: queueResult.video_info,
        database_info: {
          total_processed: videoDatabase.getStats().total_processed,
          is_predefined_id: videoDatabase.isPredefinedId(videoDatabase.extractGoogleDriveId(link))
        },
        queue_info: {
          added_to_queue: false,
          reason: 'already_processed'
        }
      });
    } else if (queueResult.reason === 'already_in_queue') {
      return res.json({
        success: true,
        message: 'Vídeo já está na fila de processamento!',
        queue_info: {
          added_to_queue: false,
          reason: 'already_in_queue'
        }
      });
    }
  }

  // Retorna resposta imediata indicando que foi adicionado à fila
  res.json({
    success: true,
    message: 'Vídeo adicionado à fila de processamento!',
    queue_info: {
      added_to_queue: true,
      queue_id: queueResult.queueId,
      position: queueResult.position,
      estimated_wait_seconds: queueResult.estimatedWait,
      max_concurrent: videoQueue.maxConcurrent
    },
    queue_stats: videoQueue.getStats()
    });
});

// Função para processar vídeo diretamente (comportamento antigo)
async function processVideoDirectly(req, res) {
  const processId = Date.now().toString();
  logWithTimestamp(`[${processId}] Iniciando processamento direto`, '⚡');
  
  const { link, pasta_drive, transkriptor } = req.body;
  
  // Verificar se vídeo já foi processado (apenas para Google Drive)
  if (isGoogleDriveUrl(link)) {
    const driveId = videoDatabase.extractGoogleDriveId(link);
    logWithTimestamp(`[${processId}] Verificando se vídeo já foi processado: ${driveId}`, '🔍');
    
    if (videoDatabase.isVideoProcessed(link)) {
      const processedVideo = videoDatabase.getProcessedVideo(link);
      logWithTimestamp(`[${processId}] Vídeo já processado anteriormente: ${driveId}`, '⏭️');
      
      return res.json({
        success: true,
        message: 'Vídeo já foi processado anteriormente!',
        already_processed: true,
        video_info: {
          id: processedVideo.id,
          title: processedVideo.title,
          processed_at: processedVideo.processed_at,
          transkriptor_id: processedVideo.transkriptor_id,
          status: processedVideo.status
        },
        database_info: {
          total_processed: videoDatabase.getStats().total_processed,
          is_predefined_id: videoDatabase.isPredefinedId(driveId)
        }
      });
    } else {
      logWithTimestamp(`[${processId}] Vídeo não encontrado no banco de dados`, 'ℹ️');
    }
    
    // Verificar se é um ID pré-definido
    if (videoDatabase.isPredefinedId(driveId)) {
      logWithTimestamp(`[${processId}] ID pré-definido detectado: ${driveId}`, '📋');
    }
  }

  // Preparar informações do vídeo para logs
  const videoInfo = {
    link: link,
    id: processId,
    title: null,
    filename: null
  };

  logWithTimestamp(`[${processId}] Processando link: ${link}`, '🎬');
  if (pasta_drive) {
    logWithTimestamp(`[${processId}] Pasta do Drive especificada: ${pasta_drive}`, '📁');
  }
  if (transkriptor) {
    logWithTimestamp(`[${processId}] Transkriptor habilitado`, '📝');
  }
  
  let tempFilePath = null;
  let outputPath = null;
  const startTime = Date.now();
  
  logWithTimestamp(`[${processId}] Tempo de início: ${new Date(startTime).toISOString()}`, '⏰');
  
      try {
      // Log 1: Iniciando conversão
      logWithTimestamp(`[${processId}] Iniciando logs de webhook...`, '📡');
      await webhookLogger.logStart(videoInfo);
      
      // Inicializar armazenamento
      logWithTimestamp(`[${processId}] Inicializando armazenamento...`, '🔧');
      await ensureStorageInitialized();
      
      // Determinar tipo de link e baixar
      let downloadPath;
      let videoTitle = null;
      
      logWithTimestamp(`[${processId}] Analisando tipo de link...`, '🔍');
      
      if (isGoogleDriveUrl(link)) {
        logWithTimestamp(`[${processId}] Link do Google Drive detectado`, '📁');
        const timestamp = Date.now();
        const tempFileName = `drive_${timestamp}.mp4`;
        const tempPath = path.join(__dirname, '../temp', tempFileName);
        logWithTimestamp(`[${processId}] Processando arquivo do Drive: ${tempFileName}`, '📁');
        const driveResult = await processarUrlGoogleDrive(link, tempPath);
        downloadPath = driveResult.path;
        videoTitle = driveResult.fileName;
        logWithTimestamp(`[${processId}] Arquivo do Drive processado: ${videoTitle}`, '✅');
        
        // Renomear o arquivo temporário para usar o nome correto do arquivo
        if (videoTitle) {
          const originalExt = path.extname(videoTitle) || '.mp4';
          const safeTitle = generateSafeFileName(videoTitle);
          const newTempFileName = `${safeTitle}_temp${originalExt}`;
          const newTempPath = path.join(__dirname, '../temp', newTempFileName);
          
          try {
            await fs.move(downloadPath, newTempPath);
            downloadPath = newTempPath;
            logWithTimestamp(`[${processId}] Arquivo temporário renomeado: ${newTempFileName}`, '📝');
          } catch (renameError) {
            logWithTimestamp(`[${processId}] Erro ao renomear arquivo temporário, mantendo nome original`, '⚠️');
          }
        }
      } else if (ytdl.validateURL(link)) {
        logWithTimestamp(`[${processId}] Link do YouTube detectado`, '📺');
        const youtubeResult = await downloadYouTubeVideo(link);
        downloadPath = youtubeResult.path;
        videoTitle = youtubeResult.title;
        logWithTimestamp(`[${processId}] Vídeo do YouTube baixado: ${videoTitle}`, '✅');
      } else {
        logWithTimestamp(`[${processId}] Link genérico detectado`, '🌐');
        downloadPath = await downloadFile(link);
        logWithTimestamp(`[${processId}] Arquivo genérico baixado`, '✅');
      }
    
          if (!downloadPath) {
        logError(`[${processId}] Falha ao baixar o arquivo`);
        throw new Error('Falha ao baixar o arquivo');
      }
      
      tempFilePath = downloadPath;
      logWithTimestamp(`[${processId}] Arquivo baixado: ${path.basename(tempFilePath)}`, '✅');
      
      // Atualizar informações do vídeo
      videoInfo.title = videoTitle;
      videoInfo.filename = path.basename(tempFilePath);
      
      // Extrair metadados do vídeo para obter o nome (se não foi extraído do YouTube ou Google Drive)
      if (!videoTitle) {
        logWithTimestamp(`[${processId}] Extraindo metadados para obter título...`, '📋');
        const metadata = await extractVideoMetadata(tempFilePath);
        videoTitle = metadata.title;
        videoInfo.title = videoTitle;
        logWithTimestamp(`[${processId}] Título extraído: ${videoTitle || 'Nome padrão'}`, '📝');
      }
      
      logWithTimestamp(`[${processId}] Gerando nome seguro para: ${videoTitle}`, '🔧');
      const safeVideoTitle = generateSafeFileName(videoTitle);
      
      // Gerar nome do arquivo baseado no título do vídeo ou nome padrão
      const timestamp = Date.now();
      const baseFileName = safeVideoTitle || `audio_${timestamp}`;
      const outputFileName = `${baseFileName}.mp3`;
      outputPath = path.join(__dirname, '../temp', outputFileName);
      
      // Garantir que o diretório temp existe
      const tempDir = path.join(__dirname, '../temp');
      await fs.ensureDir(tempDir);
      logWithTimestamp(`[${processId}] Diretório temp verificado: ${tempDir}`, '📁');
      
      logWithTimestamp(`[${processId}] Título original: "${videoTitle}"`, '📝');
      logWithTimestamp(`[${processId}] Nome seguro: "${safeVideoTitle}"`, '📝');
      logWithTimestamp(`[${processId}] Nome base: "${baseFileName}"`, '📝');
      logWithTimestamp(`[${processId}] Nome do arquivo de saída: "${outputFileName}"`, '📝');
      logWithTimestamp(`[${processId}] Caminho completo: "${outputPath}"`, '📁');
      logWithTimestamp(`[${processId}] Iniciando conversão de áudio...`, '🔄');
      await convertToMp3AndRemoveSilence(tempFilePath, outputPath);
      logWithTimestamp(`[${processId}] Conversão concluída: ${path.basename(outputPath)}`, '✅');
      
      // Verificar se o arquivo foi criado com o nome correto
      const outputFileExists = await fs.pathExists(outputPath);
      if (!outputFileExists) {
        logError(`[${processId}] Arquivo de saída não encontrado após conversão: ${outputPath}`);
        
        // Listar arquivos no diretório temp para debug
        const tempDir = path.join(__dirname, '../temp');
        const files = await fs.readdir(tempDir);
        const mp3Files = files.filter(f => f.endsWith('.mp3'));
        logWithTimestamp(`[${processId}] Arquivos .mp3 encontrados no temp: ${mp3Files.join(', ')}`, '🔍');
        
        // Tentar encontrar o arquivo com nome similar (mais robusto)
        let similarFile = null;
        
        // Primeiro, tentar encontrar por prefixo do nome base
        if (baseFileName.length > 10) {
          similarFile = mp3Files.find(f => f.includes(baseFileName.substring(0, 10)));
        }
        
        // Se não encontrou, tentar por qualquer parte do nome
        if (!similarFile && baseFileName.length > 5) {
          similarFile = mp3Files.find(f => f.includes(baseFileName.substring(0, 5)));
        }
        
        // Se ainda não encontrou, pegar o arquivo .mp3 mais recente
        if (!similarFile && mp3Files.length > 0) {
          similarFile = mp3Files[mp3Files.length - 1];
          logWithTimestamp(`[${processId}] Usando arquivo .mp3 mais recente: ${similarFile}`, '🔍');
        }
        
        if (similarFile) {
          const correctPath = path.join(tempDir, similarFile);
          logWithTimestamp(`[${processId}] Arquivo similar encontrado: ${similarFile}`, '🔍');
          logWithTimestamp(`[${processId}] Usando caminho correto: ${correctPath}`, '🔧');
          outputPath = correctPath;
        } else {
          throw new Error(`Arquivo de saída não foi criado: ${path.basename(outputPath)}`);
        }
      }
      
      // Verificar se o arquivo foi criado corretamente
      const finalOutputFileExists = await fs.pathExists(outputPath);
      if (!finalOutputFileExists) {
        logError(`[${processId}] Arquivo de saída não encontrado após conversão: ${outputPath}`);
        throw new Error(`Arquivo de saída não foi criado: ${path.basename(outputPath)}`);
      }
      
      const outputStats = await fs.stat(outputPath);
      logWithTimestamp(`[${processId}] Arquivo de saída verificado: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`, '✅');
    
          // Log 2: Conversão concluída
      const processingTime = Date.now() - startTime;
      logWithTimestamp(`[${processId}] Tempo de processamento: ${(processingTime / 1000).toFixed(2)}s`, '⏱️');
      await webhookLogger.logConversionComplete(videoInfo, processingTime);
      
      // Upload para armazenamento (apenas se não especificar pasta do Drive)
      let uploadResult = null;
      if (!pasta_drive) {
        logWithTimestamp(`[${processId}] Iniciando upload para armazenamento local...`, '📤');
        uploadResult = await uploadFile(outputPath, outputFileName);
        logWithTimestamp(`[${processId}] Upload local concluído`, '✅');
      } else {
        logWithTimestamp(`[${processId}] Pasta do Drive especificada, pulando upload local...`, '📤');
      }
      
      // Upload para pasta do Google Drive (se especificado)
      let googleDriveUploadResult = null;
      if (pasta_drive) {
        logWithTimestamp(`[${processId}] Iniciando upload para pasta do Google Drive...`, '📤');
        
        // Verificar se o arquivo existe antes do upload
        const fileExists = await fs.pathExists(outputPath);
        if (!fileExists) {
          logError(`[${processId}] Arquivo não encontrado para upload: ${outputPath}`);
          throw new Error(`Arquivo não encontrado: ${path.basename(outputPath)}`);
        }
        
        let googleDriveFolderId = extrairIdPastaDrive(pasta_drive);
        if (!googleDriveFolderId) {
          logWithTimestamp(`[${processId}] Não foi possível extrair ID da pasta, usando pasta padrão`, '⚠️');
          googleDriveFolderId = '1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz';
        }
        
        const uploadFileName = `${baseFileName}.mp3`;
        logWithTimestamp(`[${processId}] Usando pasta do Drive: ${googleDriveFolderId}`, '📁');
        logWithTimestamp(`[${processId}] Nome do arquivo para upload: ${uploadFileName}`, '📝');
        logWithTimestamp(`[${processId}] Caminho do arquivo: ${outputPath}`, '📁');
        
        googleDriveUploadResult = await uploadToGoogleDriveFolder(outputPath, uploadFileName, googleDriveFolderId);
        logWithTimestamp(`[${processId}] Upload para Google Drive concluído`, '✅');
      }
    
          // Upload para Transkriptor (se habilitado)
      let transkriptorResult = null;
      if (transkriptor === true) {
        try {
          logWithTimestamp(`[${processId}] Iniciando upload para Transkriptor...`, '📤');
          
          // Verificar se o arquivo existe antes do upload
          const fileExists = await fs.pathExists(outputPath);
          if (!fileExists) {
            logError(`[${processId}] Arquivo não encontrado para Transkriptor: ${outputPath}`);
            throw new Error(`Arquivo não encontrado: ${path.basename(outputPath)}`);
          }
          
          transkriptorResult = await transkriptorService.uploadAudio(outputPath, outputFileName, 'pt-BR');
          
          // Log 3: Transkriptor enviado
          await webhookLogger.logTranskriptorSent(videoInfo, transkriptorResult);
          logWithTimestamp(`[${processId}] Upload para Transkriptor concluído`, '✅');
          
        } catch (transkriptorError) {
          logError(`[${processId}] Erro ao enviar para Transkriptor`, transkriptorError);
          await webhookLogger.logError(videoInfo, transkriptorError, {
            stage: 'transkriptor_upload',
            additionalInfo: 'Falha no upload para Transkriptor'
          });
          // Não falhar o processo principal se o Transkriptor falhar
        }
      } else {
        logWithTimestamp(`[${processId}] Transkriptor não habilitado, pulando upload`, 'ℹ️');
      }

          // Adicionar vídeo ao banco de dados (apenas para Google Drive)
      if (isGoogleDriveUrl(link)) {
        try {
          logWithTimestamp(`[${processId}] Salvando vídeo no banco de dados...`, '💾');
          const transkriptorId = transkriptorResult ? transkriptorResult.fileId : null;
          await videoDatabase.addProcessedVideo(link, videoTitle, transkriptorId, outputFileName);
          logWithTimestamp(`[${processId}] Vídeo adicionado ao banco de dados`, '💾');
        } catch (dbError) {
          logError(`[${processId}] Erro ao salvar no banco de dados`, dbError);
          // Não falhar o processo principal se o banco falhar
        }
      } else {
        logWithTimestamp(`[${processId}] Não é link do Google Drive, pulando salvamento no banco`, 'ℹ️');
      }
      
      // Log 4: Upload completo
      logWithTimestamp(`[${processId}] Enviando log de upload completo...`, '📡');
      await webhookLogger.logUploadComplete(videoInfo, {
        googleDrive: googleDriveUploadResult,
        transkriptor: transkriptorResult,
        local: uploadResult
      });
    
      // Retornar resposta com link de download
      const totalTime = Date.now() - startTime;
      logWithTimestamp(`[${processId}] Processamento completo em ${(totalTime / 1000).toFixed(2)}s`, '🎉');
      logWithTimestamp(`[${processId}] Enviando resposta de sucesso...`, '📤');
      
      res.json({
        success: true,
        message: pasta_drive ? 'Áudio processado e enviado para Google Drive!' : 'Áudio processado com sucesso!',
        storage: {
          type: pasta_drive ? 'google_drive' : 'local',
          description: pasta_drive ? 'Arquivo enviado para Google Drive' : 'Arquivo disponível para download local'
        },
        file: {
          originalName: pasta_drive ? `${baseFileName}.mp3` : outputFileName,
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
          processingTime: `${totalTime}ms`
        }
      });
      
      // Limpar arquivos temporários APÓS enviar a resposta
      logWithTimestamp(`[${processId}] Iniciando limpeza de arquivos temporários...`, '🧹');
      await cleanupFiles([tempFilePath, outputPath]);
    
      } catch (error) {
      const errorTime = Date.now() - startTime;
      logError(`[${processId}] Erro no processamento após ${(errorTime / 1000).toFixed(2)}s`, error);
      
      // Log de erro
      logWithTimestamp(`[${processId}] Enviando log de erro para webhook...`, '📡');
      await webhookLogger.logError(videoInfo, error, {
        stage: 'processing',
        additionalInfo: 'Erro durante processamento principal'
      });
      
      // Limpar arquivos em caso de erro
      logWithTimestamp(`[${processId}] Limpando arquivos após erro...`, '🧹');
      await cleanupFiles([tempFilePath, outputPath]);
      
      logWithTimestamp(`[${processId}] Enviando resposta de erro...`, '📤');
      res.status(500).json({
        error: 'Erro no processamento do vídeo/áudio',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
}

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
    logError('Erro ao verificar status do Transkriptor', error);
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
    logError('Erro ao listar arquivos do Transkriptor', error);
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
        logWithTimestamp(`Arquivo expirado removido: ${filename}`, '🧹');
      } catch (error) {
        logWithTimestamp(`Erro ao remover arquivo expirado: ${error.message}`, '⚠️');
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

  } catch (error) {
    logError('Erro no download', error);
    res.status(500).json({
      error: 'Erro no download',
      message: error.message
    });
  }
});



// Rota para listar todos os vídeos do banco de dados
router.get('/database', async (req, res) => {
  try {
    await videoDatabase.loadDatabase();
    const videos = videoDatabase.getAllProcessedVideos();
    
    res.json({
      success: true,
      total: videos.length,
      videos: videos
    });
  } catch (error) {
    logError('Erro ao listar banco de dados', error);
    res.status(500).json({
      error: 'Erro ao listar banco de dados',
      details: error.message
    });
  }
});

// Rota para estatísticas do banco de dados
router.get('/database/stats', async (req, res) => {
  try {
    await videoDatabase.loadDatabase();
    const stats = videoDatabase.getStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logError('Erro ao obter estatísticas', error);
    res.status(500).json({
      error: 'Erro ao obter estatísticas',
      details: error.message
    });
  }
});

// Rota para buscar vídeo específico por ID
router.get('/database/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await videoDatabase.loadDatabase();
    
    const video = videoDatabase.getVideoById(id);
    
    if (!video) {
      return res.status(404).json({
        error: 'Vídeo não encontrado',
        message: `Vídeo com ID ${id} não foi encontrado no banco de dados`
      });
    }
    
    res.json({
      success: true,
      video: video
    });
  } catch (error) {
    logError('Erro ao buscar vídeo', error);
    res.status(500).json({
      error: 'Erro ao buscar vídeo',
      details: error.message
    });
  }
});

// ===== ROTAS PARA GERENCIAMENTO DA FILA =====

// Rota para obter status da fila
router.get('/queue/status', async (req, res) => {
  try {
    const queueStatus = videoQueue.getQueueStatus();
    
    res.json({
      success: true,
      queue: queueStatus
    });
  } catch (error) {
    logError('Erro ao obter status da fila', error);
    res.status(500).json({
      error: 'Erro ao obter status da fila',
      details: error.message
    });
  }
});

// Rota para obter estatísticas da fila
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = videoQueue.getStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logError('Erro ao obter estatísticas da fila', error);
    res.status(500).json({
      error: 'Erro ao obter estatísticas da fila',
      details: error.message
    });
  }
});

// Rota para limpar a fila
router.delete('/queue/clear', async (req, res) => {
  try {
    const clearedCount = videoQueue.clearQueue();
    
    res.json({
      success: true,
      message: `Fila limpa com sucesso! ${clearedCount} vídeos removidos.`,
      cleared_count: clearedCount
    });
  } catch (error) {
    logError('Erro ao limpar fila', error);
    res.status(500).json({
      error: 'Erro ao limpar fila',
      details: error.message
    });
  }
});

// Rota para remover vídeo específico da fila
router.delete('/queue/:queueId', async (req, res) => {
  try {
    const { queueId } = req.params;
    const removed = videoQueue.removeFromQueue(queueId);
    
    if (removed) {
      res.json({
        success: true,
        message: 'Vídeo removido da fila com sucesso!',
        queue_id: queueId
      });
    } else {
      res.status(404).json({
        error: 'Vídeo não encontrado na fila',
        message: `Vídeo com ID ${queueId} não foi encontrado na fila`
      });
    }
  } catch (error) {
    logError('Erro ao remover vídeo da fila', error);
    res.status(500).json({
      error: 'Erro ao remover vídeo da fila',
      details: error.message
    });
  }
});

// Atualizar a rota de status para incluir informações da fila
router.get('/status', async (req, res) => {
  try {
    await videoDatabase.loadDatabase();
    const dbStats = videoDatabase.getStats();
    const queueStats = videoQueue.getStats();
    
    res.json({
      status: 'online',
      version: '1.0.0',
      database: {
        total_processed: dbStats.total_processed,
        with_transkriptor: dbStats.with_transkriptor,
        without_transkriptor: dbStats.without_transkriptor,
        last_updated: dbStats.last_updated
      },
      queue: {
        active_processors: queueStats.activeProcessors,
        max_concurrent: queueStats.maxConcurrent,
        queue_size: queueStats.queueSize,
        is_processing: queueStats.isProcessing,
        total_queued: queueStats.totalQueued,
        total_processed: queueStats.totalProcessed,
        total_failed: queueStats.totalFailed,
        total_duplicates: queueStats.totalDuplicates
      },
      features: {
        googleDrive: 'Suportado (arquivos e pastas)',
        youtube: 'Suportado',
        genericUrls: 'Suportado',
        audioProcessing: 'Conversão para M4A + Remoção de silêncio + Normalização',
        storage: 'Armazenamento local com links de download',
        downloadLinks: 'Links temporários de 24 horas',
        autoUpload: 'Upload condicional: local (sem pasta_drive) ou Google Drive (com pasta_drive)',
        duplicatePrevention: 'Prevenção de reprocessamento via banco JSON',
        queueSystem: 'Sistema de fila com processamento 2 em 2'
      },
      endpoints: {
        process: 'POST /api/video',
        download: 'GET /api/video/download/:filename',
        status: 'GET /api/video/status',
        database: 'GET /api/video/database',
        databaseStats: 'GET /api/video/database/stats',
        queueStatus: 'GET /api/video/queue/status',
        queueStats: 'GET /api/video/queue/stats',
        clearQueue: 'DELETE /api/video/queue/clear',
        removeFromQueue: 'DELETE /api/video/queue/:queueId'
      }
    });
  } catch (error) {
    logError('Erro ao obter status', error);
    res.status(500).json({
      error: 'Erro ao obter status',
      details: error.message
    });
  }
});

module.exports = router; 