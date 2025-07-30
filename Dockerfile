# Usar imagem base do Node.js
FROM node:18-alpine

# Instalar FFmpeg e outras dependências necessárias
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p temp uploads

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 