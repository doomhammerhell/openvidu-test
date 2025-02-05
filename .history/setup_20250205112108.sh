#!/bin/bash

# Criar estrutura de diretórios
mkdir -p app/public
mkdir -p config
mkdir -p recordings
mkdir -p logs
mkdir -p certificates
mkdir -p coturn

# Criar arquivo .env
cat >.env <<EOL
DOMAIN_OR_PUBLIC_IP=localhost
OPENVIDU_SECRET=MY_SECRET
CERTIFICATE_TYPE=selfsigned
HTTPS_PORT=4443
OPENVIDU_RECORDING=false
EOL

# Instalar dependências do Node.js
cd app
npm init -y
npm install express openvidu-node-client

# Dar permissões necessárias
chmod -R 777 ../recordings
chmod -R 777 ../logs
chmod -R 777 ../certificates
chmod -R 777 ../coturn

echo "Configuração concluída! Execute 'docker-compose up -d' para iniciar os serviços."
