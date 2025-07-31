# 🚀 Guia Completo: Deploy no Servidor com Nginx

## 📋 Pré-requisitos

### ✅ **No seu servidor Linux, você precisa ter:**
- **Node.js** (versão 16 ou superior)
- **Nginx** instalado
- **Git** instalado
- **FFmpeg** instalado
- **PM2** (para gerenciar o processo Node.js)

---

## 🔧 **PASSO 1: Preparar o Servidor**

### 1.1 **Conectar no servidor via SSH**
```bash
ssh seu_usuario@seu_ip_do_servidor
```

### 1.2 **Atualizar o sistema**
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 **Instalar Node.js**
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar se instalou
node --version
npm --version
```

### 1.4 **Instalar FFmpeg**
```bash
sudo apt install ffmpeg -y

# Verificar se instalou
ffmpeg -version
```

### 1.5 **Instalar Nginx**
```bash
sudo apt install nginx -y

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 1.6 **Instalar PM2 (gerenciador de processos)**
```bash
sudo npm install -g pm2
```

---

## 📁 **PASSO 2: Baixar o Projeto**

### 2.1 **Criar pasta para o projeto**
```bash
# Ir para a pasta home
cd ~

# Criar pasta para projetos
mkdir projetos
cd projetos
```

### 2.2 **Clonar o repositório**
```bash
git clone https://github.com/mlgrupo/convert.git
cd convert
```

### 2.3 **Instalar dependências**
```bash
npm install
```

---

## ⚙️ **PASSO 3: Configurar o Projeto**

### 3.1 **Criar arquivo de configuração**
```bash
# Copiar o arquivo de exemplo
cp env.example .env

# Editar o arquivo
nano .env
```

### 3.2 **Configurar variáveis de ambiente**
```bash
# No arquivo .env, configure:
PORT=3000
NODE_ENV=production

# Se você tiver MinIO configurado, adicione:
MINIO_ENDPOINT=seu_endpoint_minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=sua_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_BUCKET_NAME=convert-audio
```

### 3.3 **Criar pastas necessárias**
```bash
# Criar pastas para arquivos temporários
mkdir temp
mkdir uploads

# Dar permissões
chmod 755 temp uploads
```

---

## 🔧 **PASSO 4: Configurar PM2**

### 4.1 **Criar arquivo de configuração do PM2**
```bash
# Criar arquivo ecosystem.config.js
nano ecosystem.config.js
```

### 4.2 **Conteúdo do arquivo ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'convert-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4.3 **Criar pasta de logs**
```bash
mkdir logs
```

### 4.4 **Iniciar a aplicação com PM2**
```bash
# Iniciar a aplicação
pm2 start ecosystem.config.js

# Salvar configuração para iniciar automaticamente
pm2 save
pm2 startup

# Verificar status
pm2 status
pm2 logs convert-api
```

---

## 🌐 **PASSO 5: Configurar Nginx**

### 5.1 **Criar arquivo de configuração do site**
```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/convert-api
```

### 5.2 **Conteúdo do arquivo de configuração do Nginx**
```nginx
server {
    listen 80;
    server_name convert.reconectaoficial.com;  # Substitua pelo seu domínio ou IP

    # Logs
    access_log /var/log/nginx/convert-api-access.log;
    error_log /var/log/nginx/convert-api-error.log;

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Configurações de upload (para arquivos grandes)
    client_max_body_size 100M;
    client_body_timeout 300s;
    client_header_timeout 300s;

    # Proxy para a aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para uploads longos
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Configuração específica para downloads
    location /api/video/download/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers para download
        add_header Content-Disposition "attachment";
        add_header Content-Type "audio/mp4";
    }
}
```

### 5.3 **Ativar o site**
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/convert-api /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

sudo systemctl reload nginx
```

---

## 🔒 **PASSO 6: Configurar SSL (HTTPS) - OPCIONAL**

### 6.1 **Instalar Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 **Obter certificado SSL**
```bash
# Substitua pelo seu domínio
sudo certbot --nginx -d seu_dominio.com

# Seguir as instruções na tela
```

### 6.3 **Renovação automática**
```bash
# Testar renovação automática
sudo certbot renew --dry-run
```

---

## 🧪 **PASSO 7: Testar a API**

### 7.1 **Testar se está funcionando**
```bash
# Testar localmente
curl http://localhost:3000/api/video/status

# Testar via Nginx
curl http://seu_dominio.com/api/video/status
```

### 7.2 **Testar processamento de vídeo**
```bash
# Exemplo de teste
curl -X POST http://seu_dominio.com/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

---

## 📊 **PASSO 8: Monitoramento e Logs**

### 8.1 **Ver logs da aplicação**
```bash
# Logs do PM2
pm2 logs convert-api

# Logs do Nginx
sudo tail -f /var/log/nginx/convert-api-access.log
sudo tail -f /var/log/nginx/convert-api-error.log
```

### 8.2 **Monitorar recursos**
```bash
# Status do PM2
pm2 monit

# Status do sistema
htop
df -h
```

---

## 🔄 **PASSO 9: Atualizações**

### 9.1 **Atualizar o código**
```bash
# Ir para a pasta do projeto
cd ~/projetos/convert

# Baixar atualizações
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Reiniciar a aplicação
pm2 restart convert-api
```

### 9.2 **Verificar se tudo está funcionando**
```bash
# Verificar status
pm2 status
sudo systemctl status nginx

# Testar API
curl http://seu_dominio.com/api/video/status
```

---

## 🛠️ **PASSO 10: Comandos Úteis**

### **Gerenciar a aplicação:**
```bash
# Iniciar
pm2 start convert-api

# Parar
pm2 stop convert-api

# Reiniciar
pm2 restart convert-api

# Ver logs
pm2 logs convert-api

# Ver status
pm2 status
```

### **Gerenciar Nginx:**
```bash
# Reiniciar
sudo systemctl restart nginx

# Recarregar configuração
sudo systemctl reload nginx

# Ver status
sudo systemctl status nginx
```

### **Ver logs:**
```bash
# Logs da aplicação
pm2 logs convert-api

# Logs do Nginx
sudo tail -f /var/log/nginx/convert-api-access.log
sudo tail -f /var/log/nginx/convert-api-error.log
```

---

## 🚨 **Solução de Problemas**

### **Se a API não responder:**
1. Verificar se PM2 está rodando: `pm2 status`
2. Verificar logs: `pm2 logs convert-api`
3. Verificar se a porta 3000 está livre: `netstat -tlnp | grep 3000`

### **Se Nginx não funcionar:**
1. Verificar configuração: `sudo nginx -t`
2. Verificar status: `sudo systemctl status nginx`
3. Verificar logs: `sudo tail -f /var/log/nginx/error.log`

### **Se uploads falharem:**
1. Verificar permissões das pastas: `ls -la temp/ uploads/`
2. Verificar espaço em disco: `df -h`
3. Verificar logs do Nginx para timeouts

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs primeiro
2. Teste localmente: `curl http://localhost:3000/api/video/status`
3. Verifique se todas as dependências estão instaladas
4. Confirme se as configurações estão corretas

**URL da sua API:** `http://seu_dominio.com` ou `https://seu_dominio.com` (se configurou SSL) 