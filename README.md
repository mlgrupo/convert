# API de Conversão de Vídeo/Audio

API Node.js para converter vídeos/audios para M4A, remover silêncio e normalizar áudio.

## 🚀 Funcionalidades

- ✅ Download de vídeos do YouTube
- ✅ Download de arquivos do Google Drive
- ✅ Download de URLs genéricas
- ✅ Conversão para M4A
- ✅ Remoção de silêncio
- ✅ Normalização de áudio
- ✅ Armazenamento local com links de download
- ✅ Suporte a Docker

## 📋 Pré-requisitos

- Docker
- Docker Compose

## 🐳 Instalação com Docker

### Método 1: Script Automático
```bash
# Dar permissão de execução
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### Método 2: Manual
```bash
# Construir e iniciar
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

## 🔧 Instalação Local

### Pré-requisitos
- Node.js 18+
- FFmpeg
- Google Service Account (para Google Drive)

### Passos
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Iniciar servidor
npm start
```

## 📡 Endpoints

### Processar Vídeo/Audio
```http
POST /api/video
Content-Type: application/json

{
  "link": "https://drive.google.com/file/d/..."
}
```

### Status da API
```http
GET /api/video/status
```

### Download de Arquivo
```http
GET /api/video/download/:filename
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_USER_EMAIL=usuario@dominio.com

# MinIO (opcional)
MINIO_ENDPOINT=minio.exemplo.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=sua-access-key
MINIO_SECRET_KEY=sua-secret-key
MINIO_BUCKET=audio-processed
```

## 📁 Estrutura do Projeto

```
├── config/
│   ├── google-auth.js    # Autenticação Google Drive
│   ├── storage.js        # Armazenamento local
│   └── minio.js          # Configuração MinIO
├── routes/
│   └── video.js          # Rotas da API
├── temp/                 # Arquivos temporários
├── uploads/              # Arquivos processados
├── Dockerfile           # Configuração Docker
├── docker-compose.yml   # Orquestração Docker
└── deploy.sh            # Script de deploy
```

## 🧹 Limpeza Automática

Os arquivos são automaticamente limpos:
- Arquivos temporários: Após processamento
- Arquivos processados: Após 24 horas

## 🔍 Troubleshooting

### Erro de Porta
```bash
# Verificar se a porta 3000 está livre
netstat -tulpn | grep :3000

# Parar processo se necessário
sudo kill -9 <PID>
```

### Erro de FFmpeg
```bash
# Verificar instalação do FFmpeg
ffmpeg -version

# Reinstalar se necessário
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg          # macOS
```

### Logs do Docker
```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs convert-api
```

## 📝 Licença

MIT License 