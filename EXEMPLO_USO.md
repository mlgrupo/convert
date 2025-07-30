# Exemplo de Uso da API

## 🎬 Processamento de Vídeo com Nome Personalizado

### Exemplo 1: YouTube (com pasta do Drive - arquivo vai para Google Drive)
```bash
curl -X POST http://localhost:3000/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "pasta_drive": "https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
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
    "originalName": "Never_Gonna_Give_You_Up.m4a",
    "fileName": null,
    "size": null,
    "downloadUrl": null,
    "bucket": null,
    "expiresIn": null
  },
  "googleDrive": {
    "fileId": "1ABC123DEF456GHI789JKL",
    "fileName": "Never_Gonna_Give_You_Up.m4a",
    "fileSize": "2048576",
    "webViewLink": "https://drive.google.com/file/d/1ABC123DEF456GHI789JKL/view",
    "folderId": "1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "pastaEspecificada": true,
    "pastaUrl": "https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz"
  },
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Never Gonna Give You Up"
  }
}
```

### Exemplo 2: YouTube (sem pasta do Drive - arquivo fica local)
```bash
curl -X POST http://localhost:3000/api/video \
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
    "originalName": "Never_Gonna_Give_You_Up.m4a",
    "fileName": "1703123456789_Never_Gonna_Give_You_Up.m4a",
    "size": 2048576,
    "downloadUrl": "http://localhost:3000/api/video/download/1703123456789_Never_Gonna_Give_You_Up.m4a",
    "bucket": "local",
    "expiresIn": "24 horas"
  },
  "googleDrive": null,
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "Never Gonna Give You Up"
  }
}
```

### Exemplo 2: Google Drive (sem pasta específica)
```bash
curl -X POST http://localhost:3000/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/1PxF4tsVWMLitI0tS4596hnxM0yOpy7Xd/view"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Áudio processado com sucesso!",
  "file": {
    "originalName": "meu_video_importante.m4a",
    "fileName": "1703123456790_meu_video_importante.m4a",
    "size": 1536000,
    "downloadUrl": "http://localhost:3000/api/video/download/1703123456790_meu_video_importante.m4a",
    "bucket": "local",
    "expiresIn": "24 horas"
  },
  "googleDrive": {
    "fileId": "1ABC123DEF456GHI789JKL",
    "fileName": "meu_video_importante.m4a",
    "fileSize": "1536000",
    "webViewLink": "https://drive.google.com/file/d/1ABC123DEF456GHI789JKL/view",
    "folderId": "1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz",
    "pastaEspecificada": false,
    "pastaUrl": "Pasta padrão"
  },
  "processing": {
    "silenceRemoved": true,
    "format": "M4A",
    "normalized": true,
    "videoTitle": "meu_video_importante"
  }
}
```

## 📋 Como Funciona

### 1. **YouTube**
- ✅ Extrai o título diretamente da API do YouTube
- ✅ Remove caracteres especiais e espaços
- ✅ Usa o título como nome do arquivo M4A

### 2. **Google Drive**
- ✅ Extrai metadados do arquivo baixado
- ✅ Procura por tags como `title`, `filename`, `name`
- ✅ Usa o nome do arquivo como fallback

### 3. **URLs Genéricas**
- ✅ Extrai metadados do arquivo
- ✅ Usa o nome do arquivo original
- ✅ Gera nome padrão se não encontrar

## 🔧 Regras de Nomenclatura

### Caracteres Permitidos:
- ✅ Letras (a-z, A-Z)
- ✅ Números (0-9)
- ✅ Underscore (_)
- ✅ Hífen (-)

### Caracteres Removidos:
- ❌ Espaços → Substituídos por underscore
- ❌ Caracteres especiais (@#$%^&*)
- ❌ Pontuação (.,!?)
- ❌ Barras (/\)

### Exemplos de Conversão:
- `"Meu Vídeo Incrível!"` → `"Meu_Video_Incrivel.m4a"`
- `"Aula@2024#Final"` → `"Aula2024Final.m4a"`
- `"Podcast - Ep. 01"` → `"Podcast_Ep_01.m4a"`

## 📁 Estrutura de Arquivos

```
temp/
├── Never_Gonna_Give_You_Up.mp4          # Vídeo baixado do YouTube
├── Never_Gonna_Give_You_Up.m4a          # Áudio processado
├── meu_video_importante.mp4             # Vídeo do Google Drive
└── meu_video_importante.m4a             # Áudio processado

uploads/
├── 1703123456789_Never_Gonna_Give_You_Up.m4a
└── 1703123456790_meu_video_importante.m4a

Google Drive - Pasta M4A:
├── Never_Gonna_Give_You_Up.m4a          # Upload automático
└── meu_video_importante.m4a             # Upload automático
```

## 🔄 Upload Automático para Google Drive

### ✅ **Funcionalidade Implementada:**
- **Sem `pasta_drive`**: Arquivo fica disponível localmente para download
- **Com `pasta_drive`**: Arquivo é enviado para Google Drive e removido do local
- **Upload Automático**: Após processamento, o arquivo M4A é enviado automaticamente
- **Nome Preservado**: Mantém o nome original do vídeo
- **Link Direto**: Retorna link para visualização no Google Drive
- **Shared Drives**: Suporte completo a pastas em Drives Compartilhados

### 📋 **Comportamento por Situação:**

#### **🔴 Sem `pasta_drive`:**
- ✅ Arquivo processado e salvo localmente
- ✅ Link de download disponível por 24 horas
- ✅ `googleDrive: null` na resposta
- ✅ `storage.type: "local"`

#### **🟢 Com `pasta_drive`:**
- ✅ Arquivo processado e enviado para Google Drive
- ✅ Arquivo removido do armazenamento local
- ✅ Link do Google Drive retornado
- ✅ `storage.type: "google_drive"`
- ✅ Suporte a Shared Drives (Drives Compartilhados)

### 📋 **Parâmetros da Request:**

#### **Obrigatório:**
- `link`: URL do vídeo/áudio (YouTube, Google Drive, URL genérica)

#### **Opcional:**
- `pasta_drive`: URL da pasta do Google Drive onde salvar o arquivo M4A

### 🔧 **Formatos de URL Suportados para pasta_drive:**
- `https://drive.google.com/drive/u/0/folders/FOLDER_ID`
- `https://drive.google.com/drive/folders/FOLDER_ID`
- `https://drive.google.com/drive/u/0/folders/FOLDER_ID?usp=sharing`
- **Shared Drives**: `https://drive.google.com/drive/u/0/folders/FOLDER_ID` (funciona automaticamente)

### 🏢 **Suporte a Shared Drives:**
- ✅ **Detecção Automática**: A API detecta automaticamente se a pasta está em um Shared Drive
- ✅ **Permissões**: Usa Domain Wide Delegation para acessar pastas compartilhadas
- ✅ **Upload**: Suporta upload direto para pastas em Shared Drives
- ✅ **Compatibilidade**: Funciona com qualquer tipo de Drive (pessoal ou compartilhado)

### 📋 **Processo Completo:**
1. **Download** do vídeo/áudio da fonte
2. **Processamento** para M4A (remoção de silêncio + normalização)
3. **Decisão de armazenamento**:
   - **Sem pasta_drive**: Upload local + link de download
   - **Com pasta_drive**: Upload Google Drive + remoção local
4. **Limpeza** dos arquivos temporários
5. **Retorno** dos links apropriados

### 🔗 **Links Retornados:**
- **Local** (sem pasta_drive): `http://localhost:3000/api/video/download/...`
- **Google Drive** (com pasta_drive): `https://drive.google.com/file/d/.../view` 