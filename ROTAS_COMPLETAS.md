# 🚀 API de Conversão de Vídeo/Audio - Rotas Completas

## 📋 **Visão Geral**

API completa para conversão de vídeos/áudios para M4A com remoção de silêncio, integração com Google Drive e Transkriptor.

---

## 🔗 **Rotas Disponíveis**

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Informações gerais da API |
| `POST` | `/api/video` | Processar vídeo/áudio |
| `GET` | `/api/video/status` | Status da API |
| `GET` | `/api/video/download/:filename` | Download do arquivo processado |

---

## 📊 **Parâmetros da API**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `link` | string | ✅ | URL do vídeo/áudio |
| `pasta_drive` | string | ❌ | URL da pasta do Google Drive |
| `transkriptor` | boolean | ❌ | Se `true`, envia para transcrição |

---

## 🎯 **Exemplos de Uso**

### **1. GET / - Informações da API**

```bash
curl -X GET http://convert.reconectaoficial.com/
```

**Resposta:**
```json
{
  "message": "API de Conversão de Vídeo/Audio",
  "endpoints": {
    "POST /api/video": "Converter vídeo/áudio para m4a e remover silêncio"
  },
  "features": {
    "Google Drive": "Suporte a download de arquivos do Google Drive",
    "YouTube": "Suporte a download de vídeos do YouTube",
    "URLs diretas": "Suporte a download de URLs diretas",
    "Armazenamento": "Armazenamento local com links de download"
  }
}
```

---

### **2. GET /api/video/status - Status da API**

```bash
curl -X GET http://convert.reconectaoficial.com/api/video/status
```

**Resposta:**
```json
{
  "status": "online",
  "version": "1.0.0",
  "features": {
    "googleDrive": "Suportado (arquivos e pastas)",
    "youtube": "Suportado",
    "genericUrls": "Suportado",
    "audioProcessing": "Conversão para M4A + Remoção de silêncio + Normalização",
    "storage": "Armazenamento local com links de download",
    "downloadLinks": "Links temporários de 24 horas",
    "autoUpload": "Upload condicional: local (sem pasta_drive) ou Google Drive (com pasta_drive)",
    "transkriptor": "Transcrição automática integrada",
    "webhookLogs": "Sistema de logs via webhook"
  },
  "endpoints": {
    "process": "POST /api/video",
    "download": "GET /api/video/download/:filename",
    "status": "GET /api/video/status"
  }
}
```

---

### **3. GET /api/video/download/:filename - Download**

```bash
curl -X GET http://convert.reconectaoficial.com/api/video/download/audio_1703123456789.m4a
```

**Resposta:** Arquivo M4A para download

---

### **4. POST /api/video - Processar Vídeo/Áudio**

#### **🎬 Exemplo 1: Conversão Básica (Apenas Download Local)**

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
  "googleDrive": null,
  "transkriptor": null,
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

#### **🎬 Exemplo 2: Conversão + Upload para Google Drive**

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
  "transkriptor": null,
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

#### **🎬 Exemplo 3: Conversão + Transkriptor (Transcrição Automática)**

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
  "googleDrive": null,
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

#### **🎬 Exemplo 4: Conversão Completa (Drive + Transkriptor)**

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

#### **🎬 Exemplo 5: YouTube para Google Drive**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
    "originalName": "Never_Gonna_Give_You_Up.m4a"
  },
  "googleDrive": {
    "fileId": "1ABC123DEF456",
    "fileName": "Never_Gonna_Give_You_Up.m4a",
    "fileSize": 5242880,
    "webViewLink": "https://drive.google.com/file/d/1ABC123DEF456/view",
    "folderId": "1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "pastaEspecificada": true,
    "pastaUrl": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
  },
  "transkriptor": null,
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

#### **🎬 Exemplo 6: URL Direta para Transkriptor**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://exemplo.com/podcast.mp4",
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
  "googleDrive": null,
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
    "videoTitle": "podcast",
    "processingTime": "45230ms"
  }
}
```

---

#### **🎬 Exemplo 7: Google Drive para Transkriptor**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/1ABC123/view",
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
  "googleDrive": null,
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
    "videoTitle": "meu_audio",
    "processingTime": "45230ms"
  }
}
```

---

#### **🎬 Exemplo 8: Apenas Google Drive (Sem Transkriptor)**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
    "originalName": "Never_Gonna_Give_You_Up.m4a"
  },
  "googleDrive": {
    "fileId": "1ABC123DEF456",
    "fileName": "Never_Gonna_Give_You_Up.m4a",
    "fileSize": 5242880,
    "webViewLink": "https://drive.google.com/file/d/1ABC123DEF456/view",
    "folderId": "1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "pastaEspecificada": true,
    "pastaUrl": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
  },
  "transkriptor": null,
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

## 📊 **Sistema de Logs Automáticos**

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

---

## 🚨 **Exemplo de Erro**

```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://link-invalido.com/video.mp4"
  }'
```

**Resposta:**
```json
{
  "error": "Erro no processamento do vídeo/áudio",
  "details": "Falha ao baixar o arquivo",
  "timestamp": "2024-01-15T10:30:10.000Z"
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

## 🔧 **Configurações Necessárias**

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

## 📈 **Funcionalidades Disponíveis**

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| **YouTube** | ✅ | Download e processamento |
| **Google Drive** | ✅ | Download e upload |
| **URLs Diretas** | ✅ | Download de qualquer link |
| **Transkriptor** | ✅ | Transcrição automática |
| **Webhook Logs** | ✅ | Monitoramento completo |
| **Timeout Fix** | ✅ | Configurações otimizadas |
| **Tratamento de Erros** | ✅ | Logs detalhados |
| **Múltiplos Uploads** | ✅ | Drive + Transkriptor simultâneo |

---

## 🎯 **Casos de Uso Comuns**

### **Podcast para Transcrição**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/podcast_ep_01/view",
    "transkriptor": true
  }'
```

### **Aula Online para Google Drive**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=aula_online",
    "pasta_drive": "https://drive.google.com/drive/folders/aulas"
  }'
```

### **Reunião Completa (Drive + Transkriptor)**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://exemplo.com/reuniao.mp4",
    "pasta_drive": "https://drive.google.com/drive/folders/reunioes",
    "transkriptor": true
  }'
```

---

## 🚀 **Status da Implementação**

**✅ API 100% Funcional com todas as funcionalidades implementadas!**

- ✅ **Conversão para M4A** com remoção de silêncio
- ✅ **Download do Google Drive** (arquivos e pastas)
- ✅ **Download do YouTube** 
- ✅ **URLs diretas** (qualquer link de vídeo/áudio)
- ✅ **Upload para Google Drive** (pasta específica ou padrão)
- ✅ **Armazenamento local** com links de download
- ✅ **Integração com Transkriptor** (transcrição automática)
- ✅ **Sistema de logs via webhook** (monitoramento completo)
- ✅ **Tratamento de erros** com notificações detalhadas
- ✅ **Timeout otimizado** (600s para uploads longos)
- ✅ **Múltiplos uploads simultâneos** (Drive + Transkriptor)

---

## 📞 **Suporte**

Para dúvidas ou problemas, consulte a documentação completa ou entre em contato com a equipe de desenvolvimento. 