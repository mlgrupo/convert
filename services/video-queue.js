const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const videoDatabase = require('./video-database');

class VideoQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 2;
        this.activeProcessors = 0;
        this.processors = [];
        this.stats = {
            totalQueued: 0,
            totalProcessed: 0,
            totalFailed: 0,
            totalDuplicates: 0,
            queueSize: 0
        };
    }

    /**
     * Adiciona um vídeo à fila
     * @param {Object} videoData - Dados do vídeo { link, title, callback, options }
     * @returns {Object} - Status da adição à fila
     */
    async addToQueue(videoData) {
        const { link, title, callback, options = {} } = videoData;
        
        // Verifica se já foi processado
        if (videoDatabase.isVideoProcessed(link)) {
            const processedVideo = videoDatabase.getProcessedVideo(link);
            this.stats.totalDuplicates++;
            
            console.log(`⏭️ Vídeo já processado (fila): ${processedVideo.id}`);
            
            if (callback) {
                callback({
                    success: true,
                    message: 'Vídeo já foi processado anteriormente!',
                    already_processed: true,
                    video_info: {
                        id: processedVideo.id,
                        title: processedVideo.title,
                        processed_at: processedVideo.processed_at,
                        transkriptor_id: processedVideo.transkriptor_id,
                        status: processedVideo.status
                    }
                });
            }
            
            return {
                added: false,
                reason: 'already_processed',
                video_info: processedVideo
            };
        }

        // Verifica se já está na fila
        const alreadyInQueue = this.queue.find(item => item.link === link);
        if (alreadyInQueue) {
            console.log(`⏳ Vídeo já está na fila: ${link}`);
            return {
                added: false,
                reason: 'already_in_queue'
            };
        }

        // Adiciona à fila
        const queueItem = {
            id: this.generateQueueId(),
            link,
            title,
            callback,
            options,
            addedAt: new Date().toISOString(),
            status: 'queued'
        };

        this.queue.push(queueItem);
        this.stats.totalQueued++;
        this.stats.queueSize = this.queue.length;

        console.log(`📥 Vídeo adicionado à fila (${this.queue.length}/${this.maxConcurrent}): ${link}`);

        // Inicia o processamento se não estiver rodando
        this.startProcessing();

        return {
            added: true,
            queueId: queueItem.id,
            position: this.queue.length,
            estimatedWait: this.estimateWaitTime()
        };
    }

    /**
     * Inicia o processamento da fila
     */
    async startProcessing() {
        if (this.processing) {
            return;
        }

        this.processing = true;
        console.log(`🚀 Iniciando processamento da fila (${this.queue.length} vídeos na fila)`);

        while (this.queue.length > 0 && this.activeProcessors < this.maxConcurrent) {
            const videoData = this.queue.shift();
            this.stats.queueSize = this.queue.length;
            
            this.activeProcessors++;
            this.processVideo(videoData);
        }

        this.processing = false;
    }

    /**
     * Processa um vídeo individual
     * @param {Object} videoData - Dados do vídeo da fila
     */
    async processVideo(videoData) {
        const { id: queueId, link, title, callback, options } = videoData;
        
        console.log(`🔄 Processando vídeo da fila (${this.activeProcessors}/${this.maxConcurrent}): ${link}`);

        try {
            // Emite evento de início do processamento
            this.emit('processing_started', {
                queueId,
                link,
                title,
                activeProcessors: this.activeProcessors,
                queueSize: this.queue.length
            });

            // Processa usando a lógica existente
            const result = await this.processVideoWithExistingLogic(link, title, options);
            
            this.stats.totalProcessed++;
            
            console.log(`✅ Vídeo processado com sucesso: ${link}`);

            // Chama o callback com o resultado
            if (callback) {
                callback(result);
            }

            // Emite evento de sucesso
            this.emit('processing_completed', {
                queueId,
                link,
                title,
                result,
                activeProcessors: this.activeProcessors,
                queueSize: this.queue.length
            });

        } catch (error) {
            this.stats.totalFailed++;
            console.error(`❌ Erro ao processar vídeo: ${link}`, error.message);

            const errorResult = {
                success: false,
                message: `Erro no processamento: ${error.message}`,
                link,
                title
            };

            // Chama o callback com o erro
            if (callback) {
                callback(errorResult);
            }

            // Emite evento de erro
            this.emit('processing_failed', {
                queueId,
                link,
                title,
                error: error.message,
                activeProcessors: this.activeProcessors,
                queueSize: this.queue.length
            });
        } finally {
            this.activeProcessors--;
            
            // Continua processando se há mais vídeos na fila
            if (this.queue.length > 0) {
                this.startProcessing();
            } else if (this.activeProcessors === 0) {
                console.log(`🏁 Fila vazia - todos os vídeos processados`);
                this.emit('queue_empty');
            }
        }
    }

    /**
     * Processa o vídeo usando a lógica existente
     * @param {string} link - Link do vídeo
     * @param {string} title - Título do vídeo
     * @param {Object} options - Opções de processamento
     * @returns {Promise<Object>} - Resultado do processamento
     */
    async processVideoWithExistingLogic(link, title, options = {}) {
        const { pasta_drive, transkriptor } = options;
        
        // Importar dependências necessárias
        const path = require('path');
        const fs = require('fs-extra');
        const webhookLogger = require('../utils/webhook');
        const transkriptorService = require('./transkriptor');
        const { uploadFile, initializeStorage } = require('../config/storage');
        
        // Importar funções de processamento compartilhadas
        const {
            downloadFile,
            downloadYouTubeVideo,
            convertToMp3AndRemoveSilence,
            generateSafeFileName,
            extrairIdPastaDrive,
            cleanupFiles,
            uploadToGoogleDriveFolder,
            processarUrlGoogleDrive,
            isGoogleDriveUrl,
            logWithTimestamp,
            logError,
            logSuccess
        } = require('./video-processing-utils');
        
        // Preparar informações do vídeo para logs
        const videoInfo = {
            link: link,
            id: Date.now().toString(),
            title: null,
            filename: null
        };
        
        console.log(`🎬 Processando vídeo da fila: ${link}`);
        let tempFilePath = null;
        let outputPath = null;
        const startTime = Date.now();
        
        try {
            // Log 1: Iniciando conversão
            await webhookLogger.logStart(videoInfo);
            
            // Inicializar armazenamento
            await initializeStorage();
            
            // Determinar tipo de link e baixar
            let downloadPath;
            let videoTitle = title;
            
            if (isGoogleDriveUrl(link)) {
                console.log('📁 Detectado link do Google Drive');
                const timestamp = Date.now();
                const tempFileName = `drive_${timestamp}.mp4`;
                const tempPath = path.join(__dirname, '../temp', tempFileName);
                const driveResult = await processarUrlGoogleDrive(link, tempPath);
                downloadPath = driveResult.path;
                videoTitle = driveResult.fileName;
                
                // Renomear o arquivo temporário para usar o nome correto do arquivo
                if (videoTitle) {
                    const originalExt = path.extname(videoTitle) || '.mp4';
                    const safeTitle = generateSafeFileName(videoTitle);
                    const newTempFileName = `${safeTitle}_temp${originalExt}`;
                    const newTempPath = path.join(__dirname, '../temp', newTempFileName);
                    
                    try {
                        await fs.move(downloadPath, newTempPath);
                        downloadPath = newTempPath;
                        console.log(`📝 Arquivo temporário renomeado: ${newTempFileName}`);
                    } catch (renameError) {
                        console.warn('⚠️ Erro ao renomear arquivo temporário, mantendo nome original');
                    }
                }
            } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
                console.log('📺 Detectado link do YouTube');
                const youtubeResult = await downloadYouTubeVideo(link);
                downloadPath = youtubeResult.path;
                videoTitle = youtubeResult.title;
            } else {
                console.log('🌐 Link genérico - fazendo download');
                downloadPath = await downloadFile(link);
                videoTitle = videoTitle || 'Vídeo da fila';
            }
            
            if (!downloadPath) {
                throw new Error('Falha ao baixar o arquivo');
            }
            
            tempFilePath = downloadPath;
            console.log(`✅ Arquivo baixado: ${tempFilePath}`);
            
            // Atualizar informações do vídeo
            videoInfo.title = videoTitle;
            videoInfo.filename = path.basename(tempFilePath);
            
            const safeVideoTitle = generateSafeFileName(videoTitle);
            
            // Gerar nome do arquivo baseado no título do vídeo ou nome padrão
            const timestamp = Date.now();
            const baseFileName = safeVideoTitle || `audio_${timestamp}`;
            const outputFileName = `${baseFileName}.mp3`;
            outputPath = path.join(__dirname, '../temp', outputFileName);
            
            console.log(`📝 Nome do arquivo: ${outputFileName}`);
                         console.log('🔄 Convertendo para MP3 e removendo silêncio...');
             
             // Fazer conversão real
             outputPath = await convertToMp3AndRemoveSilence(tempFilePath, outputPath);
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
                
                const uploadFileName = `${baseFileName}.mp3`;
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
                }
            }
            
            // Adicionar vídeo ao banco de dados (apenas para Google Drive)
            if (isGoogleDriveUrl(link)) {
                try {
                    const transkriptorId = transkriptorResult ? transkriptorResult.fileId : null;
                    await videoDatabase.addProcessedVideo(link, videoTitle, transkriptorId, outputFileName);
                    console.log('💾 Vídeo adicionado ao banco de dados');
                } catch (dbError) {
                    console.error('❌ Erro ao salvar no banco de dados:', dbError.message);
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
            
            // Retornar resultado
            return {
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
                    processingTime: `${processingTime}ms`,
                    queue_processed: true
                }
            };
            
        } catch (error) {
            console.error('❌ Erro no processamento:', error.message);
            
            // Log de erro
            await webhookLogger.logError(videoInfo, error, {
                stage: 'processing',
                additionalInfo: 'Erro durante processamento principal'
            });
            
            // Limpar arquivos em caso de erro
            await cleanupFiles([tempFilePath, outputPath]);
            
            throw error;
        }
    }

    /**
     * Gera ID único para item da fila
     * @returns {string} - ID único
     */
    generateQueueId() {
        return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Estima tempo de espera na fila
     * @returns {number} - Tempo estimado em segundos
     */
    estimateWaitTime() {
        const avgProcessingTime = 5; // segundos por vídeo
        const position = this.queue.length;
        const activeProcessors = this.activeProcessors;
        
        if (activeProcessors >= this.maxConcurrent) {
            return Math.ceil(position / this.maxConcurrent) * avgProcessingTime;
        } else {
            return Math.ceil(position / (this.maxConcurrent - activeProcessors)) * avgProcessingTime;
        }
    }

    /**
     * Obtém estatísticas da fila
     * @returns {Object} - Estatísticas
     */
    getStats() {
        return {
            ...this.stats,
            activeProcessors: this.activeProcessors,
            maxConcurrent: this.maxConcurrent,
            isProcessing: this.processing
        };
    }

    /**
     * Obtém status da fila
     * @returns {Object} - Status detalhado
     */
    getQueueStatus() {
        return {
            queue: this.queue.map(item => ({
                id: item.id,
                link: item.link,
                title: item.title,
                addedAt: item.addedAt,
                status: item.status
            })),
            stats: this.getStats()
        };
    }

    /**
     * Limpa a fila
     */
    clearQueue() {
        const clearedCount = this.queue.length;
        this.queue = [];
        this.stats.queueSize = 0;
        
        console.log(`🧹 Fila limpa - ${clearedCount} vídeos removidos`);
        this.emit('queue_cleared', { clearedCount });
        
        return clearedCount;
    }

    /**
     * Remove um vídeo específico da fila
     * @param {string} queueId - ID do item na fila
     * @returns {boolean} - Se foi removido com sucesso
     */
    removeFromQueue(queueId) {
        const index = this.queue.findIndex(item => item.id === queueId);
        if (index !== -1) {
            const removed = this.queue.splice(index, 1)[0];
            this.stats.queueSize = this.queue.length;
            
            console.log(`🗑️ Vídeo removido da fila: ${removed.link}`);
            this.emit('item_removed', removed);
            
            return true;
        }
        return false;
    }
}

// Instância singleton
const videoQueue = new VideoQueue();

module.exports = videoQueue; 