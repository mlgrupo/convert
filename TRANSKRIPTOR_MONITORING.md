# 🔍 Monitoramento do Transkriptor

## 📋 **Visão Geral**

Este documento explica como verificar o status dos arquivos enviados para o Transkriptor e monitorar os webhooks de callback.

---

## 🚀 **Como Verificar Status**

### **1. Via Script Local**

#### **Listar Todos os Arquivos**
```bash
node check-transkriptor-status.js
```

#### **Verificar Arquivo Específico**
```bash
node check-transkriptor-status.js ORDER_ID_AQUI
```

**Exemplo:**
```bash
node check-transkriptor-status.js 123456789
```

### **2. Via API**

#### **Listar Todos os Arquivos**
```bash
curl -X GET http://convert.reconectaoficial.com/api/video/transkriptor/files
```

#### **Verificar Status de Arquivo Específico**
```bash
curl -X GET http://convert.reconectaoficial.com/api/video/transkriptor/status/ORDER_ID_AQUI
```

**Exemplo:**
```bash
curl -X GET http://convert.reconectaoficial.com/api/video/transkriptor/status/123456789
```

---

## 📊 **Status Possíveis**

| Status | Descrição |
|--------|-----------|
| `uploaded` | Arquivo enviado com sucesso |
| `processing` | Em processamento |
| `completed` | Transcrição concluída |
| `failed` | Falha na transcrição |
| `cancelled` | Transcrição cancelada |

---

## 📡 **Monitoramento de Webhooks**

### **1. Testar Webhook Localmente**

```bash
node test-webhook-callback.js
```

Este script:
- ✅ Inicia um servidor local na porta 3001
- ✅ Aguarda webhooks por 5 minutos
- ✅ Testa o envio de um webhook de exemplo
- ✅ Mostra todos os webhooks recebidos

### **2. Verificar Webhooks Recebidos**

#### **Via Browser**
```
http://localhost:3001/webhooks
```

#### **Via cURL**
```bash
curl -X GET http://localhost:3001/webhooks
```

### **3. Limpar Webhooks**
```bash
curl -X DELETE http://localhost:3001/webhooks
```

---

## 📋 **Exemplos de Uso**

### **Exemplo 1: Verificar Status Após Upload**

```bash
# 1. Fazer upload com Transkriptor
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://drive.google.com/file/d/1ABC123/view",
    "transkriptor": true
  }'

# 2. Verificar status (substitua ORDER_ID pelo retornado)
curl -X GET http://convert.reconectaoficial.com/api/video/transkriptor/status/ORDER_ID
```

### **Exemplo 2: Monitoramento Contínuo**

```bash
# Terminal 1: Iniciar webhook tester
node test-webhook-callback.js

# Terminal 2: Fazer upload
curl -X POST http://convert.reconectaoficial.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "transkriptor": true
  }'

# Terminal 3: Verificar status periodicamente
watch -n 30 'curl -s http://convert.reconectaoficial.com/api/video/transkriptor/status/ORDER_ID'
```

---

## 📊 **Respostas da API**

### **Status de Arquivo**
```json
{
  "success": true,
  "status": {
    "success": true,
    "fileId": "123456789",
    "status": "completed",
    "progress": 100,
    "result": {
      "order_id": "123456789",
      "file_name": "audio_1703123456789.m4a",
      "status": "completed",
      "language": "pt-BR",
      "created_at": "2024-01-15T10:30:00.000Z",
      "completed_at": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

### **Lista de Arquivos**
```json
{
  "success": true,
  "files": [
    {
      "order_id": "123456789",
      "file_name": "audio_1703123456789.m4a",
      "status": "completed",
      "progress": 100,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "order_id": "987654321",
      "file_name": "audio_1703123456788.m4a",
      "status": "processing",
      "progress": 45,
      "created_at": "2024-01-15T10:25:00.000Z"
    }
  ]
}
```

---

## 🔧 **Configuração do Webhook**

### **URL do Webhook**
```
https://automacoes.reconectaoficial.com/webhook/transkriptor-callback
```

### **Payload do Webhook**
```json
{
  "order_id": "123456789",
  "status": "completed",
  "file_name": "audio_1703123456789.m4a",
  "language": "pt-BR",
  "transcript": "Texto transcrito aqui...",
  "duration": "00:05:30",
  "word_count": 150,
  "created_at": "2024-01-15T10:30:00.000Z",
  "completed_at": "2024-01-15T10:35:00.000Z"
}
```

---

## 🚨 **Tratamento de Erros**

### **Erro de Autenticação**
```json
{
  "error": "Erro ao verificar status do Transkriptor",
  "details": "ACCESS_TOKEN_TRANSKRIPTOR não configurado"
}
```

### **Arquivo Não Encontrado**
```json
{
  "error": "Erro ao verificar status do Transkriptor",
  "details": "Arquivo não encontrado"
}
```

---

## 📈 **Monitoramento Automático**

### **Script de Monitoramento**
```bash
#!/bin/bash
# monitor-transkriptor.sh

ORDER_ID=$1
INTERVAL=30

if [ -z "$ORDER_ID" ]; then
    echo "Uso: ./monitor-transkriptor.sh ORDER_ID"
    exit 1
fi

echo "🔍 Monitorando arquivo: $ORDER_ID"
echo "⏰ Intervalo: $INTERVAL segundos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while true; do
    STATUS=$(curl -s "http://convert.reconectaoficial.com/api/video/transkriptor/status/$ORDER_ID")
    
    if [ $? -eq 0 ]; then
        echo "$(date): $STATUS"
        
        # Verificar se está concluído
        if echo "$STATUS" | grep -q '"status":"completed"'; then
            echo "✅ Transcrição concluída!"
            break
        fi
    else
        echo "$(date): ❌ Erro ao verificar status"
    fi
    
    sleep $INTERVAL
done
```

### **Uso do Script**
```bash
chmod +x monitor-transkriptor.sh
./monitor-transkriptor.sh 123456789
```

---

## 🎯 **Dicas de Uso**

### **1. Verificar Status Imediatamente**
Após fazer upload, aguarde alguns segundos e verifique o status.

### **2. Monitoramento Contínuo**
Use o script de monitoramento para acompanhar arquivos longos.

### **3. Webhook Tester**
Sempre teste o webhook antes de usar em produção.

### **4. Logs Detalhados**
Os logs da API mostram cada etapa do processo.

---

## 📞 **Suporte**

Se encontrar problemas:

1. **Verifique o token**: `ACCESS_TOKEN_TRANSKRIPTOR` configurado
2. **Teste a conexão**: `node test-upload.js`
3. **Verifique logs**: Console da API
4. **Teste webhook**: `node test-webhook-callback.js`

**🎯 Com essas ferramentas, você tem controle total sobre o processo de transcrição!** 