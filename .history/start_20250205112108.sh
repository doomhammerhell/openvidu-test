#!/bin/bash

# Verificar se o Docker está instalado
if ! command -v docker &>/dev/null; then
    echo "Docker não está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &>/dev/null; then
    echo "Docker Compose não está instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Executar script de configuração se for a primeira vez
if [ ! -d "app" ]; then
    echo "Primeira execução detectada. Configurando ambiente..."
    chmod +x setup.sh
    ./setup.sh
fi

# Iniciar os serviços
docker-compose up -d

# Aguardar os serviços iniciarem
echo "Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
docker-compose ps

echo "Acesse http://localhost:3000 para testar a aplicação"
