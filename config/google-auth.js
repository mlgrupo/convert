const { google } = require('googleapis');
const crypto = require('crypto');
require('dotenv').config();
const fs = require('fs-extra'); // Adicionado para verificar a existência do arquivo

// Configuração da Service Account
const CONFIG = {
  serviceAccount: {
    email: 'acesso-completo-drive-gw@keen-clarity-458114-p7.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxrv199RakNvfX
zKo3ZFd3AW4P/xe4NDL2MIkx3uP9LSLT0hRKBem7fC3byQEySubF3EL+1gKiyCG1
pC27u6BJKP8SF+u3ehArVyhSiOITIdGahHGJTV4ZqRp5WZxSbPCPh5ReN+rtZtUq
KmXM6MNzZadvLF0U3ZUrl+UUBdhqR1Q3RnryMNtZYQSmkiiqQxcWGIlnx8mKlMe0
1cUuzXFlyuFKhheHBBHmdXJzmDukh+yxxMifTKLYcmkA2AYEPu+g1NwuqCascQpc
lGf43t4STLXNkrNjHAecsmZBq/RjuTodWDIq4YhIA0lRKfad/cYFhuHYfcdE6FjY
n1PPraPjAgMBAAECggEABH4RKLMerG47W/hvwVDHKVoe50ai2eRv+WuGvH0PNKKE
g+iG3MxDeZsNKcZuQlBEf3IvO3Q7wtPejlIlWd7HkbH4qQNz0ULDz+S3P0b4uFUd
kJOSr08Gdw2gfrr2Sds5Rde+t5cgWHpGH3fM9R5ZerxyPExZ2iI0GFMR1qzDKQSz
02DfiRd7Vsm2pCUl278gre6YnIUDV+2h0zLyHsj73NeVAowj1p3sIx9A7r8oBDbT
MQhD3IQphNLb98k10VXzJupLktCHAJfTF/1BaXddDqA6yAaTGzeZ+WV0u4pHR2uA
aKu/2bXfflhNHUpEHz/gmF/J2INq7U6qeHN4Tu/Y+QKBgQDsxHNIAyxcef1LsAAm
ZtG2/8fKTJwwEwUwDqqth1d15aiFCt8hgjgQ5ugRaL5rtChvcjBHaOU8gzFAX3F/
41muJ/WyIisxdNDjTGd4vagWd+d/1Q1D87SjnkvSU2+xFA4uyxgzEuNYA58PEeY9
+dIUBifjBYnaKN9i0gznas2qlwKBgQDAHeYPjzoxlTkrd3Phrls3cgsjqkqsojSh
3zZ5zPzB5n8UsmtroLhrv4fPCyVlvi+v8fPYYdBMEiUSl6PD/0BVRLzKZhSL/KKE
t3DZzKElidHpw8h3WLzzrOowR/70uCQyErpG3QSlV20eCZh51hKw4JEsMwI578Ht
WxcsNx62lQKBgQC7G1h7DT7uad0ZBiJoNpL+ik4J+dboSu+rlbud3LnqSq6NTRUe
Nvk1qjS1JVBubvYRdGzg0e1uj8LJO2PHjBRgA+Yver8lm0pEhimzCjYeY21H4UdV
bu9O6hbDRPqcNtwqcIdUPVX6RQpa72tDiPxSpLa6urLA+9HlF1fpPccASwKBgFbj
7u6wn+hXDoFbSH0VB8p++QzLc3S69EUWGKRkExl7r5Rj0fPewCpzePAqoWJv70+L
hfci3jvZpQzQqs/1vVoTebOtEbPysmqGMTNAus2olNk+pIdeCi/H0C/AEE8Mjcpb
8AYm5ngFn6OLQXwxV0jKeL5d367mgnZg0Y087NY1AoGBAKYswSewGPA1YVv7Xvza
whOpb/nC1lHyT/WeT/7Uwk74TPU+2n+U5IbjF/NuCFXUln9XPydrhR6Pxl6NYZ3f
F/Y4PyDnG/p2NjYjLM4HUvVWFYgEcH4Mm77ebee7r+ZlRSjtScc5MWvT2Zhv3q5/
iba5vqfcC7w9+/BBJvX2dR/A
-----END PRIVATE KEY-----`
  },
  userEmail: 'leorosso@reconectaoficial.com.br'
};

console.log('✅ Configuração da Service Account carregada:');
console.log(`   Email: ${CONFIG.serviceAccount.email}`);
console.log(`   Usuário: ${CONFIG.userEmail}`);
console.log(`   Domain Wide Delegation: Ativo`);

/**
 * Gera token de acesso JWT para o usuário específico
 * Seguindo exatamente o padrão do arquivo que funciona
 */
async function gerarAccessToken(emailUsuario = CONFIG.userEmail) {
  try {
    console.log(`🔐 Gerando token para: ${emailUsuario}`);
    
    const now = Math.floor(Date.now() / 1000);
    
    // Header do JWT
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT"
    };
    
    // Claims do JWT com Domain Wide Delegation
    const jwtClaims = {
      iss: CONFIG.serviceAccount.email,                    // Emissor (service account)
      scope: "https://www.googleapis.com/auth/drive",      // Escopo de acesso ao Drive
      aud: "https://oauth2.googleapis.com/token",          // Audiência (endpoint do token)
      exp: now + 3600,                                     // Expiração (1 hora)
      iat: now,                                            // Emitido em
      sub: emailUsuario                                    // Subject (usuário a impersonar)
    };
    
    console.log('📋 Claims do JWT:', {
      issuer: jwtClaims.iss,
      subject: jwtClaims.sub,
      scope: jwtClaims.scope,
      expires: new Date(jwtClaims.exp * 1000).toISOString()
    });
    
    // Codifica header e claims em base64 (usando base64url como no arquivo original)
    const encodedHeader = Buffer.from(JSON.stringify(jwtHeader)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedClaims = Buffer.from(JSON.stringify(jwtClaims)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const unsignedJwt = `${encodedHeader}.${encodedClaims}`;
    
    // Assina o JWT com a chave privada usando crypto (como no arquivo original)
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedJwt);
    const signature = sign.sign(CONFIG.serviceAccount.privateKey, 'base64');
    const encodedSignature = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const jwtToken = `${unsignedJwt}.${encodedSignature}`;
    
    console.log('🔄 Trocando JWT por access token...');
    
    // Troca o JWT por um access token (usando fetch como no arquivo original)
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta do Google:', errorText);
      throw new Error(`Falha na autenticação para ${emailUsuario}: ${errorText}`);
    }
    
    const tokenData = await response.json();
    console.log('✅ Token gerado com sucesso!');
    console.log(`   Token expira em: ${new Date((now + tokenData.expires_in) * 1000).toISOString()}`);
    
    return tokenData.access_token;
    
  } catch (error) {
    console.error('❌ Erro ao gerar access token:', error);
    throw error;
  }
}

/**
 * Cria uma instância autenticada do Google Drive
 */
async function criarDriveAutenticado(emailUsuario = CONFIG.userEmail) {
  try {
    console.log(`🔐 Criando Drive autenticado para: ${emailUsuario}`);
    
    const accessToken = await gerarAccessToken(emailUsuario);
    
    // Criar auth com o access token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: accessToken
    });
    
    console.log('✅ Drive autenticado criado com sucesso');
    return auth;
    
  } catch (error) {
    console.error('❌ Erro ao criar Drive autenticado:', error);
    throw error;
  }
}

/**
 * Verifica se um arquivo existe e tem permissões de acesso (suporta Shared Drives)
 */
async function verificarArquivo(fileId, emailUsuario = CONFIG.userEmail, sharedDriveId = null) {
  try {
    console.log(`🔍 Verificando acesso ao arquivo: ${fileId}`);
    console.log(`👤 Usuário: ${emailUsuario}`);
    
    const auth = await criarDriveAutenticado(emailUsuario);
    const drive = google.drive({ version: 'v3', auth });
    
    // Parâmetros para suportar Shared Drives
    const params = {
      fileId: fileId,
      fields: 'id,name,size,mimeType,permissions,owners,shared,trashed,parents',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    };
    if (sharedDriveId) {
      params.driveId = sharedDriveId;
    }
    
    // Tenta obter informações do arquivo
    const fileInfo = await drive.files.get(params);
    console.log(`✅ Arquivo encontrado: ${fileInfo.data.name}`);
    console.log(`   Tamanho: ${fileInfo.data.size} bytes`);
    console.log(`   Tipo MIME: ${fileInfo.data.mimeType}`);
    console.log(`   Compartilhado: ${fileInfo.data.shared}`);
    console.log(`   Na lixeira: ${fileInfo.data.trashed}`);
    
    if (fileInfo.data.owners) {
      console.log(`   Proprietários: ${fileInfo.data.owners.map(owner => owner.emailAddress).join(', ')}`);
    }
    
    if (fileInfo.data.parents) {
      console.log(`   Pasta pai: ${fileInfo.data.parents.join(', ')}`);
    }
    
    return fileInfo.data;
    
  } catch (error) {
    if (error.code === 404) {
      console.log(`❌ Arquivo não encontrado: ${fileId}`);
      console.log('🔍 Possíveis causas:');
      console.log('   - Arquivo não existe');
      console.log('   - Domain Wide Delegation não configurado');
      console.log('   - Email de impersonation incorreto');
      console.log('   - Service account sem permissões no domínio');
      return null;
    } else {
      console.error('❌ Erro ao verificar arquivo:', error.message);
      throw error;
    }
  }
}

/**
 * Baixa um arquivo do Google Drive pelo ID (suporta Shared Drives)
 */
async function baixarArquivoDrive(fileId, outputPath, emailUsuario = CONFIG.userEmail, sharedDriveId = null) {
  try {
    console.log(`⬇️  Baixando arquivo do Drive: ${fileId}`);
    console.log(`👤 Usuário: ${emailUsuario}`);
    
    // Primeiro verifica se o arquivo existe e tem permissões
    const fileInfo = await verificarArquivo(fileId, emailUsuario, sharedDriveId);
    if (!fileInfo) {
      throw new Error(`Arquivo não encontrado ou sem acesso: ${fileId}`);
    }
    
    const auth = await criarDriveAutenticado(emailUsuario);
    const drive = google.drive({ version: 'v3', auth });
    
    // Parâmetros para suportar Shared Drives
    const params = {
      fileId: fileId,
      alt: 'media',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    };
    if (sharedDriveId) {
      params.driveId = sharedDriveId;
    }
    
    // Baixa o arquivo usando get com alt: 'media'
    const response = await drive.files.get(params, { responseType: 'stream' });
    
    // Salva o arquivo
    const writer = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      response.data
        .pipe(writer)
        .on('finish', () => {
          console.log(`✅ Arquivo baixado com sucesso: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('Erro ao salvar arquivo:', error);
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('Erro ao baixar arquivo do Drive:', error);
    throw error;
  }
}

/**
 * Extrai o ID do arquivo ou pasta de uma URL do Google Drive
 */
function extrairIdDaUrl(url) {
  // Padrões para arquivos
  const filePatterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,           // /file/d/FILE_ID
    /id=([a-zA-Z0-9-_]+)/,                   // ?id=FILE_ID
    /\/d\/([a-zA-Z0-9-_]+)/,                 // /d/FILE_ID
    /\/open\?id=([a-zA-Z0-9-_]+)/,           // /open?id=FILE_ID
    /\/uc\?id=([a-zA-Z0-9-_]+)/,             // /uc?id=FILE_ID
    /\/uc\?export=download&id=([a-zA-Z0-9-_]+)/ // /uc?export=download&id=FILE_ID
  ];
  
  // Padrões para pastas
  const folderPatterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,           // /folders/FOLDER_ID
    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9-_]+)/, // /drive/u/0/folders/FOLDER_ID
  ];
  
  // Verificar se é uma pasta
  for (const pattern of folderPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { id: match[1], type: 'folder' };
    }
  }
  
  // Verificar se é um arquivo
  for (const pattern of filePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { id: match[1], type: 'file' };
    }
  }
  
  return { id: null, type: 'unknown' };
}

/**
 * Lista arquivos de vídeo/áudio em uma pasta do Google Drive (suporta Shared Drives)
 */
async function listarArquivosMidia(folderId, emailUsuario = CONFIG.userEmail, sharedDriveId = null) {
  try {
    console.log(`📁 Listando arquivos de mídia na pasta: ${folderId}`);
    console.log(`👤 Usuário: ${emailUsuario}`);
    
    const auth = await criarDriveAutenticado(emailUsuario);
    const drive = google.drive({ version: 'v3', auth });
    
    // Primeiro verifica se a pasta existe
    const folderInfo = await verificarArquivo(folderId, emailUsuario, sharedDriveId);
    if (!folderInfo) {
      throw new Error(`Pasta não encontrada ou sem acesso: ${folderId}`);
    }
    
    // Tipos MIME de arquivos de vídeo e áudio
    const mimeTypes = [
      'video/*',
      'audio/*',
      'application/octet-stream' // Para alguns arquivos de mídia
    ];
    
    const query = mimeTypes.map(type => `mimeType contains '${type.replace('*', '')}'`).join(' or ');
    
    // Parâmetros para suportar Shared Drives
    const params = {
      q: `'${folderId}' in parents and (${query}) and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,permissions,owners,shared)',
      orderBy: 'createdTime desc',
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    };
    if (sharedDriveId) {
      params.driveId = sharedDriveId;
      params.corpopra = 'drive';
    }
    
    const response = await drive.files.list(params);
    const arquivos = response.data.files || [];
    console.log(`📊 Encontrados ${arquivos.length} arquivos de mídia na pasta`);
    arquivos.forEach((arquivo, index) => {
      console.log(`   ${index + 1}. ${arquivo.name} (${arquivo.mimeType}) - ${arquivo.size} bytes`);
      if (arquivo.owners) {
        console.log(`      Proprietário: ${arquivo.owners[0].emailAddress}`);
      }
      console.log(`      Compartilhado: ${arquivo.shared}`);
    });
    return arquivos;
  } catch (error) {
    console.error('Erro ao listar arquivos de mídia:', error);
    throw error;
  }
}

/**
 * Processa uma URL do Google Drive (arquivo ou pasta)
 */
async function processarUrlGoogleDrive(url, outputPath, emailUsuario = CONFIG.userEmail) {
  const { id, type } = extrairIdDaUrl(url);
  
  if (!id) {
    throw new Error('Não foi possível extrair o ID da URL do Google Drive');
  }
  
  console.log(`🔗 Tipo detectado: ${type}, ID: ${id}`);
  console.log(`👤 Email de impersonation: ${emailUsuario}`);
  console.log(`🏢 Domain Wide Delegation: Ativo`);
  
  if (type === 'folder') {
    // Se for uma pasta, lista os arquivos de mídia e usa o primeiro
    const arquivos = await listarArquivosMidia(id, emailUsuario);
    
    if (arquivos.length === 0) {
      throw new Error('Nenhum arquivo de vídeo/áudio encontrado na pasta');
    }
    
    console.log(`📄 Usando o primeiro arquivo: ${arquivos[0].name}`);
    await baixarArquivoDrive(arquivos[0].id, outputPath, emailUsuario);
    
  } else if (type === 'file') {
    // Se for um arquivo, baixa diretamente
    await baixarArquivoDrive(id, outputPath, emailUsuario);
    
  } else {
    throw new Error('Tipo de URL não reconhecido');
  }
  
  // Retornar o caminho do arquivo baixado
  return outputPath;
}

/**
 * Verifica se uma URL é do Google Drive
 */
function isGoogleDriveUrl(url) {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

// Função para fazer upload de arquivo para pasta específica do Google Drive
async function uploadToGoogleDriveFolder(filePath, fileName, folderId) {
  try {
    console.log(`📤 Fazendo upload para pasta do Google Drive: ${fileName}`);
    console.log(`📁 Pasta ID: ${folderId}`);
    
    const auth = await criarDriveAutenticado(); // Usar criarDriveAutenticado para obter o auth
    const drive = google.drive({ version: 'v3', auth });
    
    // Verificar se o arquivo existe
    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Obter informações do arquivo
    const fileStats = await fs.stat(filePath);
    const fileSize = fileStats.size;
    
    console.log(`📁 Tamanho do arquivo: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Primeiro, verificar se a pasta existe e obter informações sobre ela
    console.log(`🔍 Verificando acesso à pasta: ${folderId}`);
    const folderInfo = await verificarArquivo(folderId);
    
    if (!folderInfo) {
      throw new Error(`Pasta não encontrada ou sem acesso: ${folderId}`);
    }
    
    console.log(`✅ Pasta encontrada: ${folderInfo.name}`);
    console.log(`📂 Tipo: ${folderInfo.mimeType}`);
    
    // Configurar metadados do arquivo
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    // Configurar mídia
    const media = {
      mimeType: 'audio/mp4', // Ajustar o mimeType conforme o tipo de arquivo
      body: fs.createReadStream(filePath)
    };
    
    // Parâmetros para upload (suporta Shared Drives)
    const uploadParams = {
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,size',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    };
    
    // Se a pasta estiver em um Shared Drive, adicionar parâmetros específicos
    if (folderInfo.parents && folderInfo.parents.length > 0) {
      console.log(`🏢 Detectado Shared Drive - Pasta pai: ${folderInfo.parents[0]}`);
      // Para Shared Drives, não precisamos especificar driveId, apenas supportsAllDrives
    }
    
    console.log(`📤 Iniciando upload com suporte a Shared Drives...`);
    
    // Fazer upload
    const response = await drive.files.create(uploadParams);
    
    console.log(`✅ Upload concluído: ${response.data.name}`);
    console.log(`🔗 Link do arquivo: ${response.data.webViewLink}`);
    console.log(`📊 Tamanho: ${(response.data.size / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      fileSize: response.data.size,
      webViewLink: response.data.webViewLink,
      folderId: folderId
    };
    
  } catch (error) {
    console.error('❌ Erro no upload para Google Drive:', error.message);
    throw error;
  }
}

module.exports = {
  CONFIG,
  gerarAccessToken,
  criarDriveAutenticado,
  verificarArquivo,
  baixarArquivoDrive,
  extrairIdDaUrl,
  listarArquivosMidia,
  processarUrlGoogleDrive,
  isGoogleDriveUrl,
  uploadToGoogleDriveFolder
}; 