const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { processarUrlGoogleDrive, isGoogleDriveUrl, uploadToGoogleDriveFolder } = require('../config/google-auth');

// Funções de logging
function getTimestamp() {
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function logWithTimestamp(message, emoji = '📝') {
  console.log(`[${getTimestamp()}] ${emoji} ${message}`);
}

function logError(message, error = null) {
  const errorMsg = error ? `${message}: ${error.message}` : message;
  logWithTimestamp(errorMsg, '❌');
  if (error && error.stack) {
    console.error(error.stack);
  }
}

function logSuccess(message) {
  logWithTimestamp(message, '✅');
}

function logProgress(stage, current, total, message = '') {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  logWithTimestamp(`${stage}: [${progressBar}] ${percentage}% ${message}`, '🔄');
}

// Função para baixar arquivo genérico
async function downloadFile(url) {
  try {
    logWithTimestamp(`Iniciando download de arquivo genérico: ${url}`, '📥');
    
    // Gerar nome único para o arquivo temporário
    const timestamp = Date.now();
    const tempFileName = `temp_${timestamp}.mp4`;
    const tempPath = path.join(__dirname, '../temp', tempFileName);
    
    logWithTimestamp(`Arquivo temporário: ${tempFileName}`, '📁');
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 300000 // 5 minutos
    });

    const contentLength = response.headers['content-length'];
    let downloadedBytes = 0;
    
    logWithTimestamp(`Tamanho do arquivo: ${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + ' MB' : 'Desconhecido'}`, '📊');

    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    // Monitorar progresso do download
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (contentLength) {
        const progress = (downloadedBytes / contentLength) * 100;
        if (progress % 10 < 1) { // Log a cada 10%
          logProgress('Download', Math.round(progress), 100, `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
        }
      }
    });

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logSuccess(`Download concluído: ${tempPath}`);
        logWithTimestamp(`Tamanho final: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`, '📊');
        resolve(tempPath);
      });
      writer.on('error', (error) => {
        logError('Erro durante download', error);
        reject(error);
      });
    });
  } catch (error) {
    logError('Erro ao baixar arquivo', error);
    throw error;
  }
}

// Função para baixar vídeo do YouTube
async function downloadYouTubeVideo(url) {
  try {
    logWithTimestamp(`Iniciando download do YouTube: ${url}`, '📺');
    
    // Obter informações do vídeo primeiro
    logWithTimestamp('Obtendo informações do vídeo...', '🔍');
    const videoInfo = await ytdl.getInfo(url);
    const videoTitle = videoInfo.videoDetails.title;
    const duration = videoInfo.videoDetails.lengthSeconds;
    const viewCount = videoInfo.videoDetails.viewCount;
    
    logWithTimestamp(`Título: ${videoTitle}`, '📝');
    logWithTimestamp(`Duração: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, '⏱️');
    logWithTimestamp(`Visualizações: ${parseInt(viewCount).toLocaleString()}`, '👁️');
    
    // Gerar nome único para o arquivo temporário
    const timestamp = Date.now();
    const safeTitle = generateSafeFileName(videoTitle) || `youtube_${timestamp}`;
    const tempFileName = `${safeTitle}.mp4`;
    const tempPath = path.join(__dirname, '../temp', tempFileName);
    
    logWithTimestamp(`Arquivo temporário: ${tempFileName}`, '📁');
    
    const stream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly'
    });
    
    const writer = fs.createWriteStream(tempPath);
    let downloadedBytes = 0;
    const totalBytes = videoInfo.formats.find(f => f.quality === 'highestaudio')?.contentLength;

    // Monitorar progresso do download
    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (totalBytes) {
        const progress = (downloadedBytes / totalBytes) * 100;
        if (progress % 10 < 1) { // Log a cada 10%
          logProgress('YouTube Download', Math.round(progress), 100, `${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
        }
      }
    });

    return new Promise((resolve, reject) => {
      stream.pipe(writer);
      writer.on('finish', () => {
        logSuccess(`Vídeo do YouTube baixado: ${tempPath}`);
        logWithTimestamp(`Tamanho final: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`, '📊');
        // Retornar o caminho e o título
        resolve({ path: tempPath, title: videoTitle });
      });
      writer.on('error', (error) => {
        logError('Erro durante download do YouTube', error);
        reject(error);
      });
    });
  } catch (error) {
    logError('Erro ao baixar vídeo do YouTube', error);
    throw error;
  }
}

// Função para converter para MP3 e remover silêncio
async function convertToMp3AndRemoveSilence(inputPath, outputPath) {
  try {
    logWithTimestamp('Iniciando conversão de áudio...', '🔄');
    logWithTimestamp(`Arquivo de entrada: ${path.basename(inputPath)}`, '📁');
    logWithTimestamp(`Arquivo de entrada (caminho completo): ${inputPath}`, '📁');
    logWithTimestamp(`Arquivo de saída: ${path.basename(outputPath)}`, '📁');
    logWithTimestamp(`Arquivo de saída (caminho completo): ${outputPath}`, '📁');
    
    // Obter informações do arquivo de entrada
    const inputStats = await fs.stat(inputPath);
    logWithTimestamp(`Tamanho do arquivo de entrada: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`, '📊');
    
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      let progressReported = false;
      
      const command = ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .audioBitrate('192k') // MP3 precisa de bitrate maior para boa qualidade
        .audioChannels(2) // Estéreo
        .audioFrequency(44100) // Frequência de amostragem padrão
        .audioFilters([
          'silenceremove=1:0:-50dB', // Remove silêncio
          'loudnorm=I=-16:TP=-1.5:LRA=11' // Normaliza áudio
        ])
        .format('mp3')
        .on('start', (commandLine) => {
          logWithTimestamp('Comando FFmpeg iniciado', '⚙️');
          logWithTimestamp(`Comando: ${commandLine}`, '🔧');
        })
        .on('progress', (progress) => {
          if (!progressReported) {
            logWithTimestamp('Conversão em andamento...', '🔄');
            progressReported = true;
          }
          
          if (progress.percent) {
            logProgress('Conversão', Math.round(progress.percent), 100, 
              `Tempo: ${progress.timemark}, FPS: ${progress.currentFps || 'N/A'}`);
          }
        })
        .on('end', () => {
          const processingTime = Date.now() - startTime;
          logSuccess(`Conversão concluída em ${(processingTime / 1000).toFixed(2)}s`);
          
          // Verificar arquivo de saída
          fs.stat(outputPath).then(async (stats) => {
            const fileSizeMB = stats.size / 1024 / 1024;
            const fileSizeGB = fileSizeMB / 1024;
            
            logWithTimestamp(`Tamanho do arquivo de saída: ${fileSizeMB.toFixed(2)} MB (${fileSizeGB.toFixed(2)} GB)`, '📊');
            logWithTimestamp(`Caminho do arquivo de saída: ${outputPath}`, '📁');
            logWithTimestamp(`Nome do arquivo de saída: ${path.basename(outputPath)}`, '📁');
            const compressionRatio = ((1 - stats.size / inputStats.size) * 100).toFixed(1);
            logWithTimestamp(`Taxa de compressão: ${compressionRatio}%`, '📈');
            
            // Verificar se o arquivo ainda está muito grande (> 1.8 GB para margem de segurança)
            if (fileSizeGB > 1.8) {
              logWithTimestamp(`⚠️ Arquivo ainda muito grande (${fileSizeGB.toFixed(2)} GB). Aplicando compressão adicional...`, '🔧');
              
              const compressedOutputPath = outputPath.replace('.mp3', '_compressed.mp3');
              
              try {
                await new Promise((resolveCompress, rejectCompress) => {
                  ffmpeg(outputPath)
                    .audioCodec('libmp3lame')
                    .audioBitrate('128k') // Compressão mais agressiva para MP3
                    .audioChannels(2)
                    .audioFrequency(44100)
                     .audioFilters([
                       'silenceremove=1:0:-50dB',
                       'loudnorm=I=-16:TP=-1.5:LRA=11'
                     ])
                     .format('mp3')
                    .on('end', () => {
                      fs.stat(compressedOutputPath).then(compressedStats => {
                        const compressedSizeMB = compressedStats.size / 1024 / 1024;
                        const compressedSizeGB = compressedSizeMB / 1024;
                        logWithTimestamp(`✅ Compressão adicional concluída: ${compressedSizeMB.toFixed(2)} MB (${compressedSizeGB.toFixed(2)} GB)`, '📊');
                        
                        // Remover arquivo original e renomear o comprimido
                        fs.remove(outputPath).then(() => {
                          fs.move(compressedOutputPath, outputPath).then(() => {
                            logWithTimestamp(`✅ Arquivo final otimizado: ${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`, '📊');
                            resolve(outputPath);
                          });
                        });
                      });
                    })
                    .on('error', (err) => {
                      logError('Erro na compressão adicional', err);
                      resolve(outputPath); // Usar arquivo original se falhar
                    })
                    .save(compressedOutputPath);
                });
              } catch (error) {
                logError('Erro durante compressão adicional', error);
                resolve(outputPath); // Usar arquivo original se falhar
              }
            } else {
              logWithTimestamp(`✅ Arquivo dentro do limite aceitável (${fileSizeGB.toFixed(2)} GB)`, '✅');
              resolve(outputPath);
            }
          }).catch(error => {
            logError('Erro ao verificar arquivo de saída', error);
            logWithTimestamp(`Tentando verificar se arquivo existe: ${outputPath}`, '🔍');
            fs.pathExists(outputPath).then(exists => {
              logWithTimestamp(`Arquivo existe: ${exists}`, '🔍');
              if (exists) {
                fs.stat(outputPath).then(stats => {
                  logWithTimestamp(`Arquivo encontrado - Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, '📊');
                  resolve(outputPath);
                }).catch(() => resolve(outputPath));
              } else {
                                 // Tentar encontrar o arquivo no diretório temp (mais robusto)
                 const tempDir = path.dirname(outputPath);
                 fs.readdir(tempDir).then(files => {
                   const mp3Files = files.filter(f => f.endsWith('.mp3'));
                   logWithTimestamp(`Arquivos .mp3 encontrados: ${mp3Files.join(', ')}`, '🔍');
                  
                  // Procurar por arquivo com nome similar (mais robusto)
                  const expectedName = path.basename(outputPath);
                  let similarFile = null;
                  
                  // Primeiro, tentar encontrar por prefixo do nome esperado
                  if (expectedName.length > 10) {
                    similarFile = mp3Files.find(f => f.includes(expectedName.substring(0, 10)));
                  }
                  
                  // Se não encontrou, tentar por qualquer parte do nome
                  if (!similarFile && expectedName.length > 5) {
                    similarFile = mp3Files.find(f => f.includes(expectedName.substring(0, 5)));
                  }
                  
                                     // Se ainda não encontrou, pegar o arquivo .mp3 mais recente
                   if (!similarFile && mp3Files.length > 0) {
                     similarFile = mp3Files[mp3Files.length - 1];
                     logWithTimestamp(`Usando arquivo .mp3 mais recente: ${similarFile}`, '🔍');
                   }
                  
                  if (similarFile) {
                    const correctPath = path.join(tempDir, similarFile);
                    logWithTimestamp(`Arquivo similar encontrado: ${similarFile}`, '🔍');
                    logWithTimestamp(`Usando caminho correto: ${correctPath}`, '🔧');
                    resolve(correctPath);
                  } else {
                    logError('Arquivo não existe após conversão', error);
                    resolve(outputPath);
                  }
                }).catch(() => {
                  logError('Arquivo não encontrado após conversão', error);
                  resolve(outputPath);
                });
              }
            }).catch(() => {
              logError('Arquivo não encontrado após conversão', error);
              resolve(outputPath);
            });
          });
        })
        .on('error', (err) => {
          const processingTime = Date.now() - startTime;
          logError(`Conversão falhou após ${(processingTime / 1000).toFixed(2)}s`, err);
          reject(err);
        })
        .save(outputPath);
    });
  } catch (error) {
    logError('Erro ao converter arquivo', error);
    throw error;
  }
}

// Função para extrair metadados do vídeo
async function extractVideoMetadata(inputPath) {
  try {
    logWithTimestamp('Extraindo metadados do vídeo...', '🔍');
    
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          logError('Erro ao extrair metadados', err);
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        const result = {
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: videoStream.r_frame_rate
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sample_rate: audioStream.sample_rate,
            channels: audioStream.channels
          } : null
        };
        
        logWithTimestamp(`Duração: ${Math.floor(result.duration / 60)}:${(result.duration % 60).toFixed(0).padStart(2, '0')}`, '⏱️');
        logWithTimestamp(`Tamanho: ${(result.size / 1024 / 1024).toFixed(2)} MB`, '📊');
        logWithTimestamp(`Bitrate: ${(result.bitrate / 1000).toFixed(0)} kbps`, '🎵');
        
        resolve(result);
      });
    });
  } catch (error) {
    logError('Erro ao extrair metadados', error);
    throw error;
  }
}

// Função para gerar nome seguro de arquivo
function generateSafeFileName(originalName) {
  if (!originalName) return null;
  
  return originalName
    .replace(/[<>:"/\\|?*]/g, '_') // Remove caracteres inválidos
    .replace(/\s+/g, '_') // Substitui espaços por underscores
    .replace(/[^\w\-_.]/g, '') // Remove caracteres especiais
    .substring(0, 100) // Limita o tamanho
    .trim();
}

// Função para extrair ID da pasta do Drive
function extrairIdPastaDrive(url) {
  if (!url) return null;
  
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Função para limpar arquivos
async function cleanupFiles(files) {
  logWithTimestamp(`Iniciando limpeza de ${files.length} arquivo(s)`, '🧹');
  
  let removedCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    if (file && await fs.pathExists(file)) {
      try {
        await fs.remove(file);
        logWithTimestamp(`Arquivo removido: ${path.basename(file)}`, '🗑️');
        removedCount++;
      } catch (error) {
        logError(`Erro ao remover arquivo ${path.basename(file)}`, error);
        errorCount++;
      }
    } else if (file) {
      logWithTimestamp(`Arquivo não encontrado: ${path.basename(file)}`, '⚠️');
    }
  }
  
  logWithTimestamp(`Limpeza concluída: ${removedCount} removidos, ${errorCount} erros`, '📊');
}

// Função para inicializar armazenamento
async function ensureStorageInitialized() {
  const storage = require('../config/storage');
  
  if (!storage.isInitialized()) {
    logWithTimestamp('Inicializando armazenamento...', '💾');
    await storage.initialize();
    logSuccess('Armazenamento inicializado');
  } else {
    logWithTimestamp('Armazenamento já inicializado', 'ℹ️');
  }
}

// Função para fazer upload de arquivo
async function uploadFile(filePath, fileName) {
  const storage = require('../config/storage');
  await ensureStorageInitialized();
  
  try {
    logWithTimestamp(`Fazendo upload: ${fileName}`, '📤');
    const result = await storage.uploadFile(filePath, fileName);
    logSuccess(`Upload concluído: ${fileName}`);
    return result;
  } catch (error) {
    logError(`Erro no upload: ${fileName}`, error);
    throw error;
  }
}

 module.exports = {
   downloadFile,
   downloadYouTubeVideo,
   convertToMp3AndRemoveSilence,
   extractVideoMetadata,
  generateSafeFileName,
  extrairIdPastaDrive,
  cleanupFiles,
  ensureStorageInitialized,
  uploadFile,
  uploadToGoogleDriveFolder,
  processarUrlGoogleDrive,
  isGoogleDriveUrl,
  logWithTimestamp,
  logError,
  logSuccess,
  logProgress
}; 