#!/bin/bash

# Deploy Backend para EC2
# Uso: ./scripts/deploy-ec2.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
EC2_USER="ec2-user"
EC2_HOST="your-ec2-domain.com"
PROJECT_DIR="/home/ec2-user/sistema-comandas"
BACKUP_DIR="/home/ec2-user/backups"

echo -e "${GREEN}=== Deploy Backend para EC2 ===${NC}"

# Verificar se SSH está configurado
if ! ssh -o ConnectTimeout=5 $EC2_USER@$EC2_HOST "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${RED}Erro: Não foi possível conectar via SSH ao servidor $EC2_HOST${NC}"
    echo "Verifique se:"
    echo "1. O servidor EC2 está acessível"
    echo "2. Sua chave SSH está configurada corretamente"
    echo "3. O security group permite SSH (porta 22)"
    exit 1
fi

echo -e "${GREEN}1. Backup da versão atual...${NC}"
ssh $EC2_USER@$EC2_HOST "
    sudo systemctl stop sistema-comandas || true
    sudo mkdir -p $BACKUP_DIR
    sudo cp -r $PROJECT_DIR $BACKUP_DIR/backup-\$(date +%Y%m%d-%H%M%S) || true
"

echo -e "${GREEN}2. Sincronizando código...${NC}"
# Excluir node_modules e arquivos de build
rsync -avz --progress \
    --exclude node_modules \
    --exclude dist \
    --exclude .git \
    --exclude logs \
    --exclude .env \
    ./ $EC2_USER@$EC2_HOST:$PROJECT_DIR/

echo -e "${GREEN}3. Configurando ambiente...${NC}"
ssh $EC2_USER@$EC2_HOST "
    cd $PROJECT_DIR
    
    # Configurar .env se não existir
    if [ ! -f .env ]; then
        cp .env.production.example .env
        echo -e '${YELLOW}AVISO: Configure o arquivo .env no servidor${NC}'
    fi
    
    # Build da aplicação
    echo 'Buildando aplicação...'
    cd backend
    npm ci --production
    npm run build
"

echo -e "${GREEN}4. Atualizando containers Docker...${NC}"
ssh $EC2_USER@$EC2_HOST "
    cd $PROJECT_DIR
    
    # Parar containers antigos
    docker compose -f docker-compose.prod.yml down || true
    
    # Build e iniciar novos containers
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d
    
    # Aguardar containers iniciarem
    sleep 10
"

echo -e "${GREEN}5. Verificando deploy...${NC}"
# Verificar se containers estão rodando
if ssh $EC2_USER@$EC2_HOST "docker compose -f $PROJECT_DIR/docker-compose.prod.yml ps | grep -q 'Up'"; then
    echo -e "${GREEN}Containers iniciados com sucesso${NC}"
else
    echo -e "${RED}Erro: Containers não iniciaram corretamente${NC}"
    ssh $EC2_USER@$EC2_HOST "docker compose -f $PROJECT_DIR/docker-compose.prod.yml logs"
    exit 1
fi

# Verificar health check
echo -e "${GREEN}6. Testando health check...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST:5000/health || echo "000")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}Health check OK (HTTP 200)${NC}"
else
    echo -e "${RED}Health check falhou (HTTP $HEALTH_CHECK)${NC}"
    echo "Verificando logs..."
    ssh $EC2_USER@$EC2_HOST "docker compose -f $PROJECT_DIR/docker-compose.prod.yml logs backend"
    exit 1
fi

# Verificar WebSocket
echo -e "${GREEN}7. Testando WebSocket...${NC}"
WEBSOCKET_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST:5000/api/socket/stats || echo "000")
if [ "$WEBSOCKET_TEST" = "200" ]; then
    echo -e "${GREEN}WebSocket endpoint OK (HTTP 200)${NC}"
else
    echo -e "${YELLOW}WebSocket endpoint não respondeu (HTTP $WEBSOCKET_TEST)${NC}"
fi

echo -e "${GREEN}8. Limpando imagens antigas...${NC}"
ssh $EC2_USER@$EC2_HOST "
    docker image prune -f
    docker volume prune -f
"

echo -e "${GREEN}=== Deploy concluído com sucesso! ===${NC}"
echo -e "${GREEN}API: http://$EC2_HOST:5000${NC}"
echo -e "${GREEN}Health: http://$EC2_HOST:5000/health${NC}"
echo -e "${GREEN}WebSocket: ws://$EC2_HOST:5000${NC}"
echo -e "${GREEN}Socket Stats: http://$EC2_HOST:5000/api/socket/stats${NC}"

# Mostrar status final
echo -e "${GREEN}Status dos containers:${NC}"
ssh $EC2_USER@$EC2_HOST "docker compose -f $PROJECT_DIR/docker-compose.prod.yml ps"
