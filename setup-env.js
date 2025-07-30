const fs = require('fs-extra');
const path = require('path');

async function createEnvFile() {
  console.log('🔧 Criando arquivo .env...');
  
  const envContent = `# Configurações do Servidor
PORT=3000
NODE_ENV=development

# JWT (para autenticação se necessário)
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=24h

# Google Service Account (para Google Drive)
GOOGLE_SERVICE_ACCOUNT_EMAIL=acesso-completo-drive-gw@keen-clarity-458114-p7.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----"
GOOGLE_USER_EMAIL=leonardorosso@reconectaoficial.com.br

# MinIO S3 Configuration
MINIO_ENDPOINT=minios3.reconectaoficial.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=developers
MINIO_SECRET_KEY=rU8QEHTAKTHYkgvHwwXfDCHHmXyoIUiuP2T3onPE0Nfc6YcV
MINIO_BUCKET_NAME=audio-processed
`;

  try {
    await fs.writeFile('.env', envContent);
    console.log('✅ Arquivo .env criado com sucesso!');
    console.log('');
    console.log('📋 Configurações incluídas:');
    console.log('   ✅ Servidor (PORT=3000)');
    console.log('   ✅ Google Service Account');
    console.log('   ✅ MinIO S3 (com suas credenciais)');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('   1. npm start - para iniciar o servidor');
    console.log('   2. node test-minio.js - para testar MinIO');
    console.log('   3. node test-api-minio.js - para testar API completa');
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createEnvFile().catch(console.error);
}

module.exports = { createEnvFile }; 