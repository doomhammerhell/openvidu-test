#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando setup do OpenVidu Broadcast...${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Docker não está instalado. Instalando...${NC}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &>/dev/null; then
  echo -e "${RED}Docker Compose não está instalado. Instalando...${NC}"
  sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Criar estrutura de diretórios se não existir
echo -e "${YELLOW}Criando estrutura de diretórios...${NC}"
mkdir -p app/public
mkdir -p recordings

# Criar Dockerfile se não existir
echo -e "${YELLOW}Configurando Dockerfile...${NC}"
cat >app/Dockerfile <<EOL
FROM node:16-alpine

WORKDIR /app

# Copiar package.json e package-lock.json primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copiar o resto dos arquivos
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOL

# Configurar package.json se não existir
if [ ! -f "app/package.json" ]; then
  echo -e "${YELLOW}Configurando package.json...${NC}"
  cat >app/package.json <<EOL
{
  "name": "app",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "openvidu-node-client": "^2.31.0"
  }
}
EOL
fi

# Instalar dependências do Node.js
echo -e "${YELLOW}Instalando dependências do Node.js...${NC}"
cd app
npm install
cd ..

# Dar permissões necessárias
echo -e "${YELLOW}Configurando permissões...${NC}"
chmod -R 777 recordings

# Parar containers existentes
echo -e "${YELLOW}Parando containers existentes...${NC}"
docker-compose down

# Remover volumes antigos
echo -e "${YELLOW}Limpando volumes antigos...${NC}"
docker volume prune -f

# Construir e iniciar os containers
echo -e "${YELLOW}Iniciando os serviços...${NC}"
docker-compose up -d --build

# Aguardar os serviços iniciarem
echo -e "${YELLOW}Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar status dos containers
echo -e "${YELLOW}Verificando status dos containers:${NC}"
docker-compose ps

# Verificar se todos os serviços estão rodando
if docker-compose ps | grep -q "Exit"; then
  echo -e "${RED}Erro: Alguns serviços não iniciaram corretamente${NC}"
  docker-compose logs
  exit 1
fi

echo -e "${GREEN}Setup concluído com sucesso!${NC}"
echo -e "${GREEN}Acesse http://localhost:3000 para testar a aplicação${NC}"
echo -e "${YELLOW}Para ver os logs dos containers:${NC}"
echo "docker logs -f openvidu-app     # Logs da aplicação"
echo "docker logs -f openvidu-server  # Logs do servidor OpenVidu"
echo "docker logs -f kms              # Logs do Kurento Media Server"
