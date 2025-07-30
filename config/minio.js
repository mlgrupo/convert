const Minio = require('minio');
require('dotenv').config();

// Configuração do MinIO - usando as credenciais reais
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'minios3.reconectaoficial.com',
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === 'true' || true,
  accessKey: process.env.MINIO_ACCESS_KEY || 'developers',
  secretKey: process.env.MINIO_SECRET_KEY || 'rU8QEHTAKTHYkgvHwwXfDCHHmXyoIUiuP2T3onPE0Nfc6YcV',
  // Configurações específicas para resolver problemas de assinatura
  region: 'us-east-1',
  transportOptions: {
    rejectUnauthorized: false // Para desenvolvimento
  }
};

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'audio-processed';

// Criar cliente MinIO
const minioClient = new Minio.Client(minioConfig);

/**
 * Inicializar MinIO - criar bucket se não existir
 */
async function initializeMinio() {
  try {
    console.log('🔧 Inicializando MinIO...');
    console.log(`   Endpoint: ${minioConfig.endPoint}:${minioConfig.port}`);
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   SSL: ${minioConfig.useSSL ? 'Sim' : 'Não'}`);
    console.log(`   Access Key: ${minioConfig.accessKey}`);
    console.log(`   Secret Key: ${minioConfig.secretKey ? 'Configurado' : 'Não configurado'}`);

    // Testar conexão primeiro com tratamento de erro específico
    console.log('🔍 Testando conexão com MinIO...');
    
    try {
      const buckets = await minioClient.listBuckets();
      console.log('✅ Conexão com MinIO estabelecida');
      console.log(`   Buckets disponíveis: ${buckets.length}`);
    } catch (connectionError) {
      console.error('❌ Erro na conexão inicial:', connectionError.message);
      
      // Tentar com configurações alternativas
      if (connectionError.code === 'SignatureDoesNotMatch') {
        console.log('🔄 Tentando configuração alternativa...');
        
        // Tentar sem SSL primeiro
        const altConfig = { ...minioConfig, useSSL: false, port: 9000 };
        const altClient = new Minio.Client(altConfig);
        
        try {
          await altClient.listBuckets();
          console.log('✅ Conexão alternativa bem-sucedida (sem SSL)');
          // Atualizar cliente principal
          Object.assign(minioClient, altClient);
        } catch (altError) {
          console.error('❌ Configuração alternativa também falhou:', altError.message);
          throw connectionError;
        }
      } else {
        throw connectionError;
      }
    }

    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`📦 Criando bucket: ${BUCKET_NAME}`);
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      
      // Configurar política de acesso público para leitura
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      
      try {
        await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
        console.log('✅ Política de acesso configurada');
      } catch (policyError) {
        console.warn('⚠️ Erro ao configurar política (pode ser normal):', policyError.message);
      }
    } else {
      console.log('✅ Bucket já existe');
    }

    console.log('✅ MinIO inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar MinIO:', error.message);
    
    // Logs detalhados para debug
    if (error.code === 'NetworkingError') {
      console.error('   💡 Verifique se o endpoint está correto e acessível');
      console.error('   💡 Tente: ping minios3.reconectaoficial.com');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.error('   💡 Verifique se o MINIO_ACCESS_KEY está correto');
      console.error('   💡 Access Key atual:', minioConfig.accessKey);
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('   💡 Verifique se o MINIO_SECRET_KEY está correto');
      console.error('   💡 Secret Key atual:', minioConfig.secretKey ? 'Configurado' : 'Não configurado');
      console.error('   💡 Tente verificar as credenciais no painel do MinIO');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Servidor MinIO não está respondendo');
      console.error('   💡 Verifique se o MinIO está rodando');
    }
    
    throw error;
  }
}

/**
 * Upload de arquivo para o MinIO
 */
async function uploadToMinio(filePath, fileName) {
  try {
    console.log(`📤 Fazendo upload para MinIO: ${fileName}`);
    
    // Verificar se o arquivo existe
    const fs = require('fs-extra');
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
    
    // Fazer upload
    await minioClient.fPutObject(BUCKET_NAME, uniqueFileName, filePath, {
      'Content-Type': 'audio/mp4',
      'Content-Disposition': `attachment; filename="${fileName}"`
    });
    
    console.log(`✅ Upload concluído: ${uniqueFileName}`);
    
    // Gerar URL de download
    const downloadUrl = await minioClient.presignedGetObject(BUCKET_NAME, uniqueFileName, 24 * 60 * 60); // 24 horas
    
    return {
      fileName: uniqueFileName,
      originalName: fileName,
      downloadUrl: downloadUrl,
      bucket: BUCKET_NAME,
      size: stats.size
    };
  } catch (error) {
    console.error('❌ Erro no upload para MinIO:', error.message);
    throw error;
  }
}

/**
 * Deletar arquivo do MinIO
 */
async function deleteFromMinio(fileName) {
  try {
    console.log(`🗑️ Deletando arquivo do MinIO: ${fileName}`);
    await minioClient.removeObject(BUCKET_NAME, fileName);
    console.log(`✅ Arquivo deletado: ${fileName}`);
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo do MinIO:', error.message);
    throw error;
  }
}

/**
 * Listar arquivos no bucket
 */
async function listFiles(prefix = '') {
  try {
    const files = [];
    const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified
        });
      });
      
      stream.on('end', () => {
        resolve(files);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
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
    await minioClient.statObject(BUCKET_NAME, fileName);
    return true;
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * Obter informações do arquivo
 */
async function getFileInfo(fileName) {
  try {
    const stats = await minioClient.statObject(BUCKET_NAME, fileName);
    return {
      name: fileName,
      size: stats.size,
      lastModified: stats.lastModified,
      etag: stats.etag,
      contentType: stats.metaData['content-type']
    };
  } catch (error) {
    console.error('❌ Erro ao obter informações do arquivo:', error.message);
    throw error;
  }
}

module.exports = {
  minioClient,
  BUCKET_NAME,
  initializeMinio,
  uploadToMinio,
  deleteFromMinio,
  listFiles,
  fileExists,
  getFileInfo
}; 