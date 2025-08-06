# Sistema de Banco de Dados JSON

## Visão Geral

O projeto agora inclui um sistema de banco de dados JSON para rastrear vídeos já processados e evitar reprocessamento desnecessário. Este sistema é especialmente útil para vídeos do Google Drive.

## Funcionalidades

### ✅ Prevenção de Reprocessamento
- Verifica automaticamente se um vídeo já foi processado
- Evita reprocessamento de vídeos já transcritos
- Economiza tempo e recursos

### ✅ Rastreamento Completo
- Armazena informações detalhadas de cada vídeo processado
- Inclui IDs do Transkriptor quando aplicável
- Mantém histórico de processamento

### ✅ IDs Pré-definidos
- Lista de 14 IDs pré-definidos já marcados como processados
- Evita reprocessamento de vídeos conhecidos

## Estrutura do Banco de Dados

### Arquivo: `data/processed-videos.json`

```json
{
  "processed_videos": [
    {
      "id": "1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P",
      "link": "https://drive.google.com/file/d/1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P/view",
      "title": "Nome do Vídeo",
      "processed_at": "2024-01-15T10:30:00.000Z",
      "transkriptor_id": "transkriptor_order_id",
      "status": "processed",
      "file_name": "video_processed.m4a"
    }
  ],
  "metadata": {
    "total_processed": 14,
    "last_updated": "2024-01-15T10:30:00.000Z",
    "version": "1.0"
  }
}
```

## Como Funciona

### 1. Verificação Automática
Quando uma requisição é feita para processar um vídeo:

```javascript
// Verifica se já foi processado
if (videoDatabase.isVideoProcessed(link)) {
  // Retorna informação do vídeo já processado
  return res.json({
    success: true,
    message: 'Vídeo já foi processado anteriormente!',
    already_processed: true,
    video_info: { ... }
  });
}
```

### 2. Extração de ID
O sistema extrai automaticamente o ID do Google Drive da URL:

```javascript
// Padrões suportados:
// /file/d/FILE_ID
// /drive/u/0/folders/FOLDER_ID  
// ?id=FILE_ID
// /d/FILE_ID
```

### 3. Registro Automático
Após processamento bem-sucedido:

```javascript
// Adiciona ao banco automaticamente
await videoDatabase.addProcessedVideo(
  link, 
  videoTitle, 
  transkriptorId, 
  outputFileName
);
```

## Endpoints da API

### 📊 Status da API (com estatísticas do banco)
```bash
GET /api/video/status
```

### 📋 Listar todos os vídeos processados
```bash
GET /api/video/database
```

### 📈 Estatísticas do banco
```bash
GET /api/video/database/stats
```

### 🔍 Buscar vídeo específico
```bash
GET /api/video/database/:id
```

## IDs Pré-definidos

Os seguintes IDs já estão marcados como processados:

1. `1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P`
2. `1VRkdbMtF3vgEkIl1dwdBVlZdMtGkwydf`
3. `1PG3WMvaXSVD0wrIXihNccwG0zTgXXCVx`
4. `17o093NBiVZY3jcw5BHgR0S0_7o_6AwvZ`
5. `15fyqHfAoytHnFe64euzBVWAraeErIGnZ`
6. `1IWs9uWwhI6RRzYfIAhOm-4TWsCEFmJTG`
7. `14dBt04E0Aw99EJz3o931y1ckesnCbLlo`
8. `1wPX-4psAWFRA9nytV9HYrchObqI2nmYM`
9. `12jWFsZiRqWAaW_6hX45oMo4CzRDbZLOC`
10. `1mjRa9HBu4onJY2IojObjWezObOnfZncm`
11. `1xSVrHf86r5dSEwW8gy5r_L-j3fGLfRJd`
12. `1zTAWEtIPpho5KGt14bJQFONaJgazHKZl`
13. `19NgVfjEZl7VX0otiwKuIn6RSy0S9SZht`
14. `1ih3wY2bShULlGP5-UY1W_F4W3nGYIDsX`

## Comandos Úteis

### Popular banco de dados com IDs pré-definidos
```bash
npm run populate-db
```

### Verificar status do banco
```bash
curl http://localhost:3000/api/video/database/stats
```

### Listar todos os vídeos
```bash
curl http://localhost:3000/api/video/database
```

## Respostas da API

### Vídeo já processado
```json
{
  "success": true,
  "message": "Vídeo já foi processado anteriormente!",
  "already_processed": true,
  "video_info": {
    "id": "1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P",
    "title": "Nome do Vídeo",
    "processed_at": "2024-01-15T10:30:00.000Z",
    "transkriptor_id": "transkriptor_order_id",
    "status": "processed"
  },
  "database_info": {
    "total_processed": 14,
    "is_predefined_id": true
  }
}
```

### Estatísticas do banco
```json
{
  "success": true,
  "stats": {
    "total_processed": 14,
    "with_transkriptor": 10,
    "without_transkriptor": 4,
    "last_updated": "2024-01-15T10:30:00.000Z"
  }
}
```

## Vantagens

1. **Eficiência**: Evita reprocessamento desnecessário
2. **Economia**: Reduz custos de processamento e transcrição
3. **Rastreabilidade**: Histórico completo de processamento
4. **Simplicidade**: Banco JSON simples e fácil de manter
5. **Flexibilidade**: Fácil de expandir e modificar

## Manutenção

### Backup do banco
```bash
cp data/processed-videos.json backup/processed-videos-backup.json
```

### Limpar banco
```bash
rm data/processed-videos.json
npm run populate-db
```

### Adicionar novos IDs pré-definidos
Edite o arquivo `services/video-database.js` e adicione os novos IDs na função `isPredefinedId()`. 