# Sistema de Fila de Processamento de Vídeos

## Visão Geral

O sistema de fila foi implementado para gerenciar o processamento de múltiplos vídeos de forma controlada, processando **2 vídeos simultaneamente** conforme solicitado. O sistema integra-se com o banco de dados existente para evitar reprocessamento de vídeos já convertidos.

## Características Principais

### 🔄 Processamento 2 em 2
- **Máximo de 2 vídeos processando simultaneamente**
- **Fila automática** para vídeos adicionais
- **Processamento sequencial** quando há espaço disponível

### 🛡️ Prevenção de Duplicatas
- **Verificação automática** no banco de dados antes do processamento
- **Detecção de vídeos já na fila** para evitar duplicação
- **Integração com IDs pré-definidos** do banco de dados

### 📊 Monitoramento em Tempo Real
- **Estatísticas detalhadas** da fila
- **Status de cada vídeo** na fila
- **Logs completos** de processamento

## Como Funciona

### 1. Adição à Fila
```javascript
// Exemplo de requisição
POST /api/video
{
  "link": "https://drive.google.com/file/d/...",
  "pasta_drive": "https://drive.google.com/drive/u/0/folders/...",
  "transkriptor": true,
  "use_queue": true  // Habilita o sistema de fila
}
```

### 2. Verificação de Duplicatas
- ✅ Verifica se o vídeo já foi processado (banco de dados)
- ✅ Verifica se o vídeo já está na fila
- ✅ Adiciona à fila se não for duplicata

### 3. Processamento
- 🔄 Processa 2 vídeos simultaneamente
- 📝 Usa toda a lógica existente (download, conversão, upload, Transkriptor)
- 💾 Salva no banco de dados após processamento
- 🧹 Limpa arquivos temporários

## Endpoints da API

### Processamento com Fila
```http
POST /api/video
Content-Type: application/json

{
  "link": "https://drive.google.com/file/d/...",
  "pasta_drive": "https://drive.google.com/drive/u/0/folders/...",
  "transkriptor": true,
  "use_queue": true
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Vídeo adicionado à fila de processamento!",
  "queue_info": {
    "added_to_queue": true,
    "queue_id": "queue_1703123456789_abc123def",
    "position": 3,
    "estimated_wait_seconds": 15,
    "max_concurrent": 2
  },
  "queue_stats": {
    "totalQueued": 5,
    "totalProcessed": 2,
    "totalFailed": 0,
    "totalDuplicates": 1,
    "queueSize": 3,
    "activeProcessors": 2,
    "maxConcurrent": 2,
    "isProcessing": true
  }
}
```

### Status da Fila
```http
GET /api/video/queue/status
```

**Resposta:**
```json
{
  "success": true,
  "queue": {
    "queue": [
      {
        "id": "queue_1703123456789_abc123def",
        "link": "https://drive.google.com/file/d/...",
        "title": "Vídeo Teste",
        "addedAt": "2023-12-21T10:30:45.123Z",
        "status": "queued"
      }
    ],
    "stats": {
      "totalQueued": 5,
      "totalProcessed": 2,
      "totalFailed": 0,
      "totalDuplicates": 1,
      "queueSize": 3,
      "activeProcessors": 2,
      "maxConcurrent": 2,
      "isProcessing": true
    }
  }
}
```

### Estatísticas da Fila
```http
GET /api/video/queue/stats
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "totalQueued": 5,
    "totalProcessed": 2,
    "totalFailed": 0,
    "totalDuplicates": 1,
    "queueSize": 3,
    "activeProcessors": 2,
    "maxConcurrent": 2,
    "isProcessing": true
  }
}
```

### Limpar Fila
```http
DELETE /api/video/queue/clear
```

**Resposta:**
```json
{
  "success": true,
  "message": "Fila limpa com sucesso! 3 vídeos removidos.",
  "cleared_count": 3
}
```

### Remover Vídeo Específico
```http
DELETE /api/video/queue/{queueId}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Vídeo removido da fila com sucesso!",
  "queue_id": "queue_1703123456789_abc123def"
}
```

## Casos de Uso

### 1. Processamento de 100 Vídeos
```javascript
// Exemplo de script para processar 100 vídeos
const videos = [
  // ... 100 vídeos
];

for (const video of videos) {
  await axios.post('/api/video', {
    link: video.link,
    pasta_drive: video.pasta_drive,
    transkriptor: video.transkriptor,
    use_queue: true
  });
  
  // Aguardar um pouco entre as requisições
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 2. Monitoramento em Tempo Real
```javascript
// Verificar status a cada 5 segundos
setInterval(async () => {
  const stats = await axios.get('/api/video/queue/stats');
  console.log(`Processadores ativos: ${stats.data.stats.activeProcessors}`);
  console.log(`Vídeos na fila: ${stats.data.stats.queueSize}`);
  console.log(`Total processados: ${stats.data.stats.totalProcessed}`);
}, 5000);
```

### 3. Processamento Direto (Sem Fila)
```javascript
// Para processar um vídeo diretamente (comportamento antigo)
await axios.post('/api/video', {
  link: video.link,
  pasta_drive: video.pasta_drive,
  transkriptor: video.transkriptor,
  use_queue: false  // Desabilita a fila
});
```

## Estrutura do Sistema

### Arquivos Principais
- `services/video-queue.js` - Sistema de fila principal
- `routes/video.js` - Rotas integradas com a fila
- `test-queue.js` - Script de teste da fila

### Classes e Métodos

#### VideoQueue Class
```javascript
class VideoQueue extends EventEmitter {
  // Propriedades
  queue = []                    // Array de vídeos na fila
  processing = false            // Se está processando
  maxConcurrent = 2            // Máximo de processadores simultâneos
  activeProcessors = 0         // Processadores ativos
  stats = {}                   // Estatísticas da fila

  // Métodos principais
  async addToQueue(videoData)  // Adiciona vídeo à fila
  async startProcessing()      // Inicia processamento
  async processVideo(videoData) // Processa vídeo individual
  getStats()                   // Retorna estatísticas
  getQueueStatus()             // Retorna status completo
  clearQueue()                 // Limpa a fila
  removeFromQueue(queueId)     // Remove vídeo específico
}
```

## Eventos do Sistema

O sistema emite eventos para monitoramento:

```javascript
videoQueue.on('processing_started', (data) => {
  console.log(`Vídeo iniciado: ${data.link}`);
});

videoQueue.on('processing_completed', (data) => {
  console.log(`Vídeo concluído: ${data.link}`);
});

videoQueue.on('processing_failed', (data) => {
  console.log(`Vídeo falhou: ${data.link} - ${data.error}`);
});

videoQueue.on('queue_empty', () => {
  console.log('Fila vazia - todos os vídeos processados');
});
```

## Configuração

### Variáveis de Configuração
```javascript
// Em services/video-queue.js
this.maxConcurrent = 2;  // Número de vídeos simultâneos
```

### Personalização
- **Alterar concorrência**: Modifique `maxConcurrent` na classe `VideoQueue`
- **Adicionar prioridades**: Implemente sistema de prioridades na fila
- **Persistência**: Salve a fila em arquivo para sobreviver a reinicializações

## Testes

### Script de Teste Automático
```bash
# Executar teste da fila
node test-queue.js
```

### Teste Manual
```bash
# 1. Adicionar vídeos à fila
curl -X POST http://localhost:3000/api/video \
  -H "Content-Type: application/json" \
  -d '{"link":"https://drive.google.com/file/d/...","use_queue":true}'

# 2. Verificar status
curl http://localhost:3000/api/video/queue/status

# 3. Verificar estatísticas
curl http://localhost:3000/api/video/queue/stats
```

## Benefícios

### ✅ Controle de Carga
- **Evita sobrecarga** do servidor
- **Processamento controlado** de múltiplos vídeos
- **Recursos otimizados** (CPU, memória, rede)

### ✅ Prevenção de Duplicatas
- **Economia de recursos** evitando reprocessamento
- **Integração com banco de dados** existente
- **Detecção inteligente** de vídeos já processados

### ✅ Monitoramento
- **Visibilidade completa** do processamento
- **Estatísticas em tempo real**
- **Logs detalhados** para debugging

### ✅ Escalabilidade
- **Fácil ajuste** da concorrência
- **Sistema modular** e extensível
- **Compatibilidade** com lógica existente

## Troubleshooting

### Problemas Comuns

#### 1. Fila não processa vídeos
- Verificar se o servidor está rodando
- Verificar logs de erro
- Verificar se há espaço em disco

#### 2. Vídeos duplicados na fila
- Verificar se o banco de dados está carregado
- Verificar se a verificação de duplicatas está funcionando

#### 3. Processamento lento
- Verificar recursos do servidor
- Ajustar `maxConcurrent` se necessário
- Verificar conexão com Google Drive/Transkriptor

### Logs Importantes
```bash
# Logs de processamento
📥 Vídeo adicionado à fila (3/2): https://drive.google.com/...
🔄 Processando vídeo da fila (2/2): https://drive.google.com/...
✅ Vídeo processado com sucesso: https://drive.google.com/...
🏁 Fila vazia - todos os vídeos processados
```

## Próximos Passos

### Melhorias Sugeridas
1. **Persistência da fila** - Salvar em arquivo/banco
2. **Sistema de prioridades** - Vídeos importantes primeiro
3. **Retry automático** - Reenviar vídeos que falharam
4. **Interface web** - Dashboard para monitoramento
5. **Notificações** - Webhook/email quando processamento termina

### Integração com Sistemas Externos
- **Webhook callbacks** quando vídeo é processado
- **API de status** para sistemas externos
- **Métricas** para monitoramento (Prometheus, etc.) 