const axios = require('axios');

class WebhookLogger {
  constructor() {
    this.logsWebhookUrl = 'https://automacoes.reconectaoficial.com/webhook/logs-server';
  }

  async sendLog(logData) {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        ...logData
      };

      await axios.post(this.logsWebhookUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`📤 Log enviado via webhook: ${logData.type}`);
    } catch (error) {
      console.error('❌ Erro ao enviar log via webhook:', error.message);
      // Não falhar o processo principal se o webhook falhar
    }
  }

  async logStart(videoInfo) {
    await this.sendLog({
      type: 'START',
      message: `Iniciando conversão do vídeo: ${videoInfo.title || videoInfo.filename || 'Nome não identificado'}`,
      videoInfo: {
        title: videoInfo.title,
        filename: videoInfo.filename,
        link: videoInfo.link,
        id: videoInfo.id
      }
    });
  }

  async logConversionComplete(videoInfo, processingTime) {
    await this.sendLog({
      type: 'CONVERSION_COMPLETE',
      message: `Conversão concluída para o vídeo: ${videoInfo.title || videoInfo.filename || 'Nome não identificado'}`,
      processingTime: `${processingTime}ms`,
      videoInfo: {
        title: videoInfo.title,
        filename: videoInfo.filename,
        link: videoInfo.link,
        id: videoInfo.id
      }
    });
  }

  async logTranskriptorSent(videoInfo, transkriptorData) {
    await this.sendLog({
      type: 'TRANSKRIPTOR_SENT',
      message: `Enviado áudio para Transkriptor com URL de callback`,
      videoInfo: {
        title: videoInfo.title,
        filename: videoInfo.filename,
        link: videoInfo.link,
        id: videoInfo.id
      },
      transkriptor: {
        fileId: transkriptorData.fileId,
        status: transkriptorData.status
      }
    });
  }

  async logUploadComplete(videoInfo, uploadData) {
    await this.sendLog({
      type: 'UPLOAD_COMPLETE',
      message: `Upload para o drive concluído, upload para o transkriptor concluído`,
      videoInfo: {
        title: videoInfo.title,
        filename: videoInfo.filename,
        link: videoInfo.link,
        id: videoInfo.id
      },
      uploads: {
        googleDrive: uploadData.googleDrive,
        transkriptor: uploadData.transkriptor,
        local: uploadData.local
      }
    });
  }

  async logError(videoInfo, error, context = {}) {
    await this.sendLog({
      type: 'ERROR',
      message: `Erro durante processamento: ${error.message}`,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      videoInfo: {
        title: videoInfo.title,
        filename: videoInfo.filename,
        link: videoInfo.link,
        id: videoInfo.id
      },
      context: {
        stage: context.stage,
        additionalInfo: context.additionalInfo
      }
    });
  }
}

module.exports = new WebhookLogger(); 