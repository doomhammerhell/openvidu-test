# Configuração OpenVidu para Transmissão Unidirecional

Esta é uma configuração personalizada do OpenVidu onde apenas o host pode transmitir áudio/vídeo, e outros participantes são restritos apenas à visualização.

## Requisitos

- Docker
- Docker Compose
- Node.js (para o servidor de permissões)

## Estrutura de Diretórios

```
.
├── docker-compose.yml            # Arquivo principal do Docker Compose
├── .env                         # Variáveis de ambiente
├── health-check.sh             # Script de monitoramento
├── config/                     # Configurações do OpenVidu
│   └── openvidu-config.properties
├── permission-server/          # Servidor de gerenciamento de permissões
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── logs/                       # Logs dos serviços
└── recordings/                 # Gravações das sessões
```

## Funcionalidades Principais

### 1. Controle de Permissões
- O primeiro participante a entrar na sala é automaticamente definido como host
- O host tem permissões completas (áudio, vídeo, moderação)
- Outros participantes só podem visualizar (sem áudio/vídeo)

### 2. Servidor de Permissões
O servidor Node.js gerencia automaticamente as permissões através de:
- Geração de tokens com permissões específicas
- Webhooks para controle em tempo real
- Integração direta com a API do OpenVidu

### 3. Monitoramento
- Verificação automática do status dos serviços
- Recuperação automática em caso de falhas
- Logs detalhados de todas as operações

## Instalação e Configuração

1. Clone este repositório
2. Configure o arquivo `.env` com suas configurações:
   ```bash
   DOMAIN_OR_PUBLIC_IP=seu_dominio_ou_ip
   OPENVIDU_SECRET=sua_senha_secreta
   ```

3. Inicie os serviços:
   ```bash
   docker-compose up -d
   ```

4. Configure o monitoramento automático:
   ```bash
   # Adicione ao crontab para executar a cada 5 minutos
   */5 * * * * /caminho/para/health-check.sh >> /caminho/para/health-check.log 2>&1
   ```

## Segurança

- Todas as comunicações são criptografadas
- Permissões são controladas no nível do servidor
- Impossível burlar as restrições de áudio/vídeo
- Servidor TURN configurado para atravessar NAT

## Logs e Monitoramento

Os logs são armazenados em diretórios específicos:
- `/logs/openvidu-server.log`: Logs do servidor OpenVidu
- `/logs/coturn.log`: Logs do servidor TURN
- `/logs/nginx.log`: Logs do proxy reverso
- `/logs/permission-server.log`: Logs do servidor de permissões

## Arquitetura do Sistema

### Componentes Principais:
1. **OpenVidu Server**: Gerencia as sessões de videoconferência
2. **Servidor de Permissões**: Controla as permissões dos participantes
3. **TURN Server**: Facilita conexões através de NAT/Firewall
4. **Nginx**: Atua como proxy reverso

### Fluxo de Funcionamento:
1. Quando um participante tenta entrar:
   - O servidor verifica se é o primeiro participante (host)
   - Gera um token com as permissões apropriadas
   - Aplica as restrições automaticamente

2. Durante a sessão:
   - Host: pode transmitir áudio/vídeo
   - Outros participantes: apenas visualização
   - Todas as permissões são controladas pelo servidor

## Solução de Problemas

### Problemas Comuns:
1. **Serviço não inicia**:
   - Verifique os logs em `/logs/`
   - Execute `docker-compose ps` para ver o status dos containers
   - Verifique se as portas necessárias estão disponíveis

2. **Problemas de Permissão**:
   - Verifique os logs do servidor de permissões
   - Confirme se o webhook está configurado corretamente
   - Verifique a conectividade entre os serviços

3. **Problemas de Conexão**:
   - Verifique a configuração do TURN
   - Confirme se o domínio/IP está correto no `.env`
   - Verifique os logs do Nginx

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs específicos do serviço com problema
2. Use o script de health-check para diagnóstico
3. Verifique a conectividade entre os serviços
