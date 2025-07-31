# 🎬 API de Conversão de Vídeo/Audio - Exemplos de Uso

## 📋 **Funcionalidades Disponíveis**

- ✅ **Conversão para M4A** com remoção de silêncio
- ✅ **Download do Google Drive** (arquivos e pastas)
- ✅ **Download do YouTube** 
- ✅ **URLs diretas** (qualquer link de vídeo/áudio)
- ✅ **Upload para Google Drive** (pasta específica ou padrão)
- ✅ **Armazenamento local** com links de download
- ✅ **Integração com Transkriptor** (transcrição automática)
- ✅ **Sistema de logs via webhook** (monitoramento completo)
- ✅ **Tratamento de erros** com notificações detalhadas

---

## 🚀 **Exemplos de Uso**

### **1. Conversão Básica (Apenas Download Local)**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Áudio processado com sucesso!",
  "storage": {
    "type": "local",
    "description": "Arquivo disponível para download local"
  },
  "file": {
    "originalName": "audio_1703123456789.m4a",
    "fileName": "audio_1703123456789.m4a",
    "size": 5242880,
    "downloadUrl": "http://convert.reconectaoficial.com/api/video/download/audio_1703123456789.m4a",
    "bucket": "uploads",
    "expiresIn": "24 horas"
  },
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Rick Astley - Never Gonna Give You Up",
    "processingTime": "45230ms"
  }
}
```

---

### **2. Conversão + Upload para Google Drive**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/1ABC123/view",
    "pasta_drive": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Áudio processado e enviado para Google Drive!",
  "storage": {
    "type": "google_drive",
    "description": "Arquivo enviado para Google Drive"
  },
  "file": {
    "originalName": "meu_audio.m4a"
  },
  "googleDrive": {
    "fileId": "1ABC123DEF456",
    "fileName": "meu_audio.m4a",
    "fileSize": 5242880,
    "webViewLink": "https://drive.google.com/file/d/1ABC123DEF456/view",
    "folderId": "1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "pastaEspecificada": true,
    "pastaUrl": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
  },
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Meu Áudio",
    "processingTime": "45230ms"
  }
}
```

---

### **3. Conversão + Transkriptor (Transcrição Automática)**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "transkriptor": true
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Áudio processado com sucesso!",
  "storage": {
    "type": "local",
    "description": "Arquivo disponível para download local"
  },
  "file": {
    "originalName": "audio_1703123456789.m4a",
    "fileName": "audio_1703123456789.m4a",
    "size": 5242880,
    "downloadUrl": "http://convert.reconectaoficial.com/api/video/download/audio_1703123456789.m4a",
    "bucket": "uploads",
    "expiresIn": "24 horas"
  },
  "transkriptor": {
    "fileId": "trans_123456789",
    "status": "uploaded",
    "fileName": "audio_1703123456789.m4a",
    "language": "pt-BR",
    "webhookUrl": "https://automacoes.reconectaoficial.com/webhook/transkriptor-callback"
  },
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Rick Astley - Never Gonna Give You Up",
    "processingTime": "45230ms"
  }
}
```

---

### **4. Conversão Completa (Drive + Transkriptor)**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/1ABC123/view",
    "pasta_drive": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "transkriptor": true
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Áudio processado e enviado para Google Drive!",
  "storage": {
    "type": "google_drive",
    "description": "Arquivo enviado para Google Drive"
  },
  "file": {
    "originalName": "meu_audio.m4a"
  },
  "googleDrive": {
    "fileId": "1ABC123DEF456",
    "fileName": "meu_audio.m4a",
    "fileSize": 5242880,
    "webViewLink": "https://drive.google.com/file/d/1ABC123DEF456/view",
    "folderId": "1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "pastaEspecificada": true,
    "pastaUrl": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
  },
  "transkriptor": {
    "fileId": "trans_123456789",
    "status": "uploaded",
    "fileName": "meu_audio.m4a",
    "language": "pt-BR",
    "webhookUrl": "https://automacoes.reconectaoficial.com/webhook/transkriptor-callback"
  },
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Meu Áudio",
    "processingTime": "45230ms"
  }
}
```

---

## 📁 **Tipos de Links Suportados**

### **Google Drive**
```json
{
  "link": "https://drive.google.com/file/d/1ABC123/view"
}
```

### **YouTube**
```json
{
  "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### **URL Direta**
```json
{
  "link": "https://exemplo.com/video.mp4"
}
```

---

## 🔧 **Parâmetros Disponíveis**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `link` | string | ✅ | URL do vídeo/áudio para processar |
| `pasta_drive` | string | ❌ | URL da pasta do Google Drive para upload |
| `transkriptor` | boolean | ❌ | Se `true`, envia para transcrição automática |

---

## 📊 **Sistema de Logs**

A API envia automaticamente logs para o webhook configurado:

### **Log 1: Início do Processamento**
```json
{
  "type": "START",
  "message": "Iniciando conversão do vídeo: Nome do Vídeo",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "videoInfo": {
    "title": "Nome do Vídeo",
    "filename": "video.mp4",
    "link": "https://youtube.com/watch?v=...",
    "id": "1703123456789"
  }
}
```

### **Log 2: Conversão Concluída**
```json
{
  "type": "CONVERSION_COMPLETE",
  "message": "Conversão concluída para o vídeo: Nome do Vídeo",
  "processingTime": "45230ms",
  "timestamp": "2024-01-15T10:30:45.230Z",
  "videoInfo": {
    "title": "Nome do Vídeo",
    "filename": "video.mp4",
    "link": "https://youtube.com/watch?v=...",
    "id": "1703123456789"
  }
}
```

### **Log 3: Transkriptor Enviado**
```json
{
  "type": "TRANSKRIPTOR_SENT",
  "message": "Enviado áudio para Transkriptor com URL de callback",
  "timestamp": "2024-01-15T10:30:50.000Z",
  "videoInfo": {
    "title": "Nome do Vídeo",
    "filename": "video.mp4",
    "link": "https://youtube.com/watch?v=...",
    "id": "1703123456789"
  },
  "transkriptor": {
    "fileId": "trans_123456789",
    "status": "uploaded"
  }
}
```

### **Log 4: Upload Completo**
```json
{
  "type": "UPLOAD_COMPLETE",
  "message": "Upload para o drive concluído, upload para o transkriptor concluído",
  "timestamp": "2024-01-15T10:31:00.000Z",
  "videoInfo": {
    "title": "Nome do Vídeo",
    "filename": "video.mp4",
    "link": "https://youtube.com/watch?v=...",
    "id": "1703123456789"
  },
  "uploads": {
    "googleDrive": {
      "fileId": "1ABC123DEF456",
      "fileName": "meu_audio.m4a"
    },
    "transkriptor": {
      "fileId": "trans_123456789",
      "status": "uploaded"
    },
    "local": null
  }
}
```

### **Log de Erro**
```json
{
  "type": "ERROR",
  "message": "Erro durante processamento: Falha ao baixar arquivo",
  "timestamp": "2024-01-15T10:30:10.000Z",
  "error": {
    "message": "Falha ao baixar arquivo",
    "stack": "Error: Falha ao baixar arquivo\n    at downloadFile...",
    "name": "Error"
  },
  "videoInfo": {
    "title": "Nome do Vídeo",
    "filename": "video.mp4",
    "link": "https://youtube.com/watch?v=...",
    "id": "1703123456789"
  },
  "context": {
    "stage": "download",
    "additionalInfo": "Falha no download do arquivo"
  }
}
```

---

## 🔗 **Endpoints Disponíveis**

### **POST /api/video**
Processa vídeo/áudio e retorna link de download

### **GET /api/video/download/:filename**
Download direto do arquivo processado

### **GET /api/video/status**
Status da API e funcionalidades disponíveis

### **GET /**
Informações gerais da API

---

## ⚙️ **Configurações Necessárias**

### **Variáveis de Ambiente (.env)**
```env
# Google Drive
GOOGLE_USER_EMAIL=seu-email@dominio.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Transkriptor
ACCESS_TOKEN_TRANSKRIPTOR=seu-token-transkriptor

# Armazenamento
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
MINIO_USE_SSL=false
```

---

## 🚨 **Tratamento de Erros**

A API possui tratamento robusto de erros:

- ✅ **Logs detalhados** via webhook
- ✅ **Informações completas** do erro
- ✅ **Contexto do processamento**
- ✅ **Limpeza automática** de arquivos temporários
- ✅ **Não falha** se Transkriptor estiver indisponível

---

## 📈 **Monitoramento**

- 📊 **Logs em tempo real** via webhook
- 🔍 **Rastreamento completo** do processamento
- ⚡ **Métricas de performance** (tempo de processamento)
- 🚨 **Alertas automáticos** para erros
- 📋 **Status detalhado** de cada etapa 