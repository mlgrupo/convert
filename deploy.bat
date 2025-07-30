@echo off
echo 🚀 Iniciando deploy da API de Conversão de Vídeo/Audio...

REM Verificar se o Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está instalado. Por favor, instale o Docker primeiro.
    pause
    exit /b 1
)

REM Verificar se o Docker Compose está instalado
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro.
    pause
    exit /b 1
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Construir a imagem
echo 🔨 Construindo imagem Docker...
docker-compose build --no-cache

REM Iniciar os serviços
echo 🚀 Iniciando serviços...
docker-compose up -d

REM Aguardar um pouco para o serviço inicializar
echo ⏳ Aguardando inicialização...
timeout /t 10 /nobreak >nul

REM Verificar se o serviço está rodando
echo 🔍 Verificando status do serviço...
curl -f http://localhost:3000/api/video/status >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro ao verificar status da API
    echo 📋 Logs do container:
    docker-compose logs
    pause
    exit /b 1
) else (
    echo ✅ API está rodando com sucesso!
    echo 🌐 Acesse: http://localhost:3000
    echo 📊 Status: http://localhost:3000/api/video/status
)

echo 🎉 Deploy concluído com sucesso!
pause 