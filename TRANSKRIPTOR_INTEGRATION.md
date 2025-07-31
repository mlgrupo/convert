# 🎤 Integração com Transkriptor

## 📋 **Visão Geral**

A API agora suporta integração completa com o **Transkriptor** para transcrição automática de áudio. Quando o parâmetro `transkriptor: true` é enviado na requisição, o áudio processado é automaticamente enviado para transcrição.

---

## 🚀 **Como Usar**

### **Exemplo Básico**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "transkriptor": true
  }'
```

### **Exemplo Completo (Drive + Transkriptor)**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/1ABC123/view",
    "pasta_drive": "https://drive.google.com/drive/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "transkriptor": true
  }'
```

---

## 📊 **Resposta da API**

### **Com Transkriptor Habilitado**
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
    "videoTitle": "Nome do Vídeo",
    "processingTime": "45230ms"
  }
}
```

### **Sem Transkriptor**
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
  "transkriptor": null,
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Nome do Vídeo",
    "processingTime": "45230ms"
  }
}
```

---

## 🔧 **Configuração**

### **Variável de Ambiente**
```env
ACCESS_TOKEN_TRANSKRIPTOR=seu_token_transkriptor_aqui
```

### **Parâmetros da Requisição**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `transkriptor` | boolean | ❌ | Se `true`, envia para transcrição automática |

---

## 📡 **Webhook de Callback**

### **URL Configurada**
```
https://automacoes.reconectaoficial.com/webhook/transkriptor-callback
```

### **Payload do Webhook**
Quando o Transkriptor concluir a transcrição, ele enviará um webhook para a URL configurada com os dados da transcrição.

---

## 📊 **Sistema de Logs**

### **Log de Envio para Transkriptor**
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

### **Log de Upload Completo**
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

## 🚨 **Tratamento de Erros**

### **Erro no Transkriptor**
Se o Transkriptor falhar, a API:
- ✅ **Não falha** o processamento principal
- ✅ **Registra o erro** nos logs
- ✅ **Continua** com o upload para Google Drive/local
- ✅ **Retorna** o resultado sem a seção `transkriptor`

### **Log de Erro**
```json
{
  "type": "ERROR",
  "message": "Erro durante processamento: Falha no upload para Transkriptor",
  "timestamp": "2024-01-15T10:30:50.000Z",
  "error": {
    "message": "Transkriptor API Error: 401 - Unauthorized",
    "stack": "Error: Transkriptor API Error...",
    "name": "Error"
  },
  "videoInfo": {
    "title": "Nome do Vídeo",
    "filename": "video.mp4",
    "link": "https://youtube.com/watch?v=...",
    "id": "1703123456789"
  },
  "context": {
    "stage": "transkriptor_upload",
    "additionalInfo": "Falha no upload para Transkriptor"
  }
}
```

---

## 🔄 **Fluxo de Processamento**

### **Com Transkriptor Habilitado**
1. **Download** do vídeo/áudio
2. **Conversão** para M4A + remoção de silêncio
3. **Upload** para Google Drive (se especificado)
4. **Upload** para Transkriptor (paralelo)
5. **Logs** de cada etapa
6. **Retorno** dos resultados

### **Sem Transkriptor**
1. **Download** do vídeo/áudio
2. **Conversão** para M4A + remoção de silêncio
3. **Upload** para Google Drive (se especificado)
4. **Logs** de cada etapa
5. **Retorno** dos resultados

---

## 📋 **Status do Transkriptor**

### **Status Possíveis**
- `uploaded`: Arquivo enviado com sucesso
- `processing`: Em processamento
- `completed`: Transcrição concluída
- `failed`: Falha na transcrição

### **Verificar Status**
```bash
curl -X GET https://api.transkriptor.com/v1/files/trans_123456789 \
  -H "Authorization: Bearer seu_token_transkriptor"
```

---

## 🎯 **Casos de Uso**

### **1. Podcast para Transcrição**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/podcast_ep_01/view",
    "transkriptor": true
  }'
```

### **2. Aula Online para Transcrição**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=aula_online",
    "pasta_drive": "https://drive.google.com/drive/folders/aulas",
    "transkriptor": true
  }'
```

### **3. Reunião para Transcrição**
```bash
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://exemplo.com/reuniao.mp4",
    "transkriptor": true
  }'
```

---

## 🔧 **Configurações Avançadas**

### **Idioma da Transcrição**
Atualmente configurado para **Português Brasileiro (pt-BR)**.

### **Processo de Upload**
A API do Transkriptor funciona em 3 etapas:
1. **Obter URL de upload** - Solicita URL temporária
2. **Upload do arquivo** - Envia arquivo para URL temporária
3. **Iniciar transcrição** - Inicia processamento com URL pública

### **Timeout**
- **Upload URL**: 10 segundos
- **Upload arquivo**: 120 segundos
- **Status Check**: 30 segundos

### **Formato Suportado**
- **Entrada**: M4A (após processamento)
- **Saída**: Texto transcrito

---

## 📈 **Monitoramento**

### **Métricas Disponíveis**
- ✅ **Tempo de upload** para Transkriptor
- ✅ **Status** da transcrição
- ✅ **Taxa de sucesso** dos uploads
- ✅ **Logs detalhados** de cada etapa

### **Alertas**
- 🚨 **Falha no upload** para Transkriptor
- 🚨 **Timeout** na API
- 🚨 **Erro de autenticação**
- 🚨 **Arquivo não encontrado** 