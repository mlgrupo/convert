#!/bin/bash

echo "🚀 Iniciando deploy da API de Conversão de Vídeo/Audio..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir a imagem
echo "🔨 Construindo imagem Docker..."
docker-compose build --no-cache

# Iniciar os serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar um pouco para o serviço inicializar
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar se o serviço está rodando
echo "🔍 Verificando status do serviço..."
if curl -f http://localhost:3000/api/video/status > /dev/null 2>&1; then
    echo "✅ API está rodando com sucesso!"
    echo "🌐 Acesse: http://localhost:3000"
    echo "📊 Status: http://localhost:3000/api/video/status"
else
    echo "❌ Erro ao verificar status da API"
    echo "📋 Logs do container:"
    docker-compose logs
    exit 1
fi

echo "🎉 Deploy concluído com sucesso!" 