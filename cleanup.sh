#!/bin/bash

# Parar todos os containers
docker-compose down

# Remover volumes e networks não utilizados
docker system prune -f

# Limpar diretórios criados (opcional)
read -p "Deseja remover todos os arquivos criados? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    rm -rf app config recordings logs certificates coturn .env
fi
