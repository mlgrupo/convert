#!/bin/bash

# 🚀 Script de Deploy Automatizado para Servidor
# Execute este script no seu servidor Linux

echo "🚀 Iniciando deploy da API de Conversão..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then
    print_error "Não execute este script como root!"
    exit 1
fi

# PASSO 1: Atualizar sistema
print_status "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y
print_success "Sistema atualizado!"

# PASSO 2: Instalar dependências
print_status "Instalando dependências..."

# Node.js
if ! command -v node &> /dev/null; then
    print_status "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js instalado!"
else
    print_success "Node.js já está instalado!"
fi

# FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    print_status "Instalando FFmpeg..."
    sudo apt install ffmpeg -y
    print_success "FFmpeg instalado!"
else
    print_success "FFmpeg já está instalado!"
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    print_status "Instalando Nginx..."
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx instalado e iniciado!"
else
    print_success "Nginx já está instalado!"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    print_status "Instalando PM2..."
    sudo npm install -g pm2
    print_success "PM2 instalado!"
else
    print_success "PM2 já está instalado!"
fi

# PASSO 3: Configurar projeto
print_status "Configurando projeto..."

# Criar pasta de projetos se não existir
if [ ! -d ~/projetos ]; then
    mkdir -p ~/projetos
fi

cd ~/projetos

# Clonar ou atualizar repositório
if [ -d "convert" ]; then
    print_status "Atualizando repositório existente..."
    cd convert
    git pull origin main
else
    print_status "Clonando repositório..."
    git clone https://github.com/mlgrupo/convert.git
    cd convert
fi

# Instalar dependências
print_status "Instalando dependências do projeto..."
npm install

# Criar pastas necessárias
print_status "Criando pastas necessárias..."
mkdir -p temp uploads logs
chmod 755 temp uploads

# Configurar arquivo .env
if [ ! -f .env ]; then
    print_status "Criando arquivo .env..."
    cp env.example .env
    print_warning "Configure o arquivo .env com suas configurações!"
    print_warning "Execute: nano .env"
fi

# PASSO 4: Configurar PM2
print_status "Configurando PM2..."

# Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
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
EOF

# PASSO 5: Configurar Nginx
print_status "Configurando Nginx..."

# Solicitar domínio/IP
echo ""
read -p "Digite seu domínio ou IP do servidor: " SERVER_NAME

# Criar configuração do Nginx
sudo tee /etc/nginx/sites-available/convert-api > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_NAME;

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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts para uploads longos
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Configuração específica para downloads
    location /api/video/download/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Headers para download
        add_header Content-Disposition "attachment";
        add_header Content-Type "audio/mp4";
    }
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/convert-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    print_success "Nginx configurado com sucesso!"
else
    print_error "Erro na configuração do Nginx!"
    exit 1
fi

# PASSO 6: Iniciar aplicação
print_status "Iniciando aplicação..."

# Parar aplicação se já estiver rodando
pm2 stop convert-api 2>/dev/null || true
pm2 delete convert-api 2>/dev/null || true

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save
pm2 startup

print_success "Aplicação iniciada com sucesso!"

# PASSO 7: Testar
print_status "Testando aplicação..."

# Aguardar um pouco para a aplicação inicializar
sleep 5

# Testar API
if curl -s http://localhost:3000/api/video/status > /dev/null; then
    print_success "API está funcionando localmente!"
else
    print_error "API não está respondendo localmente!"
fi

# Testar via Nginx
if curl -s http://$SERVER_NAME/api/video/status > /dev/null; then
    print_success "API está funcionando via Nginx!"
else
    print_warning "API não está respondendo via Nginx. Verifique o firewall!"
fi

# PASSO 8: Informações finais
echo ""
print_success "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Informações importantes:"
echo "   🌐 URL da API: http://$SERVER_NAME"
echo "   📁 Pasta do projeto: ~/projetos/convert"
echo "   📝 Logs da aplicação: pm2 logs convert-api"
echo "   📝 Logs do Nginx: sudo tail -f /var/log/nginx/convert-api-access.log"
echo ""
echo "🛠️ Comandos úteis:"
echo "   • Reiniciar aplicação: pm2 restart convert-api"
echo "   • Ver status: pm2 status"
echo "   • Ver logs: pm2 logs convert-api"
echo "   • Reiniciar Nginx: sudo systemctl reload nginx"
echo ""
print_warning "⚠️ IMPORTANTE: Configure o arquivo .env com suas configurações!"
echo "   Execute: nano ~/projetos/convert/.env"
echo ""
print_warning "🔒 Para HTTPS, execute: sudo certbot --nginx -d $SERVER_NAME"
echo ""
print_success "✅ Deploy finalizado! Sua API está pronta para uso!" 