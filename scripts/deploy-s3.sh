#!/bin/bash

# Deploy Frontend para S3 + CloudFront
# Uso: ./scripts/deploy-s3.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
BUCKET_NAME="sistema-comandas-frontend"
CLOUDFRONT_ID="E123456789ABCDEF"
BUILD_DIR="frontend/dist"

echo -e "${GREEN}=== Deploy Frontend para S3 + CloudFront ===${NC}"

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Erro: AWS CLI não encontrado${NC}"
    echo "Instale AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar se está logado na AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Erro: Não está logado na AWS${NC}"
    echo "Execute: aws configure"
    exit 1
fi

# Verificar se o bucket existe
if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo -e "${YELLOW}Bucket S3 não encontrado. Criando...${NC}"
    aws s3 mb "s3://$BUCKET_NAME"
    
    # Configurar bucket para website
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html
    
    echo -e "${GREEN}Bucket criado: s3://$BUCKET_NAME${NC}"
fi

echo -e "${GREEN}1. Build do frontend...${NC}"
cd frontend

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm ci
fi

# Build para produção
echo "Buildando aplicação..."
npm run build

# Verificar se build foi criado
if [ ! -d "dist" ]; then
    echo -e "${RED}Erro: Build não gerado${NC}"
    exit 1
fi

echo -e "${GREEN}2. Sincronizando arquivos com S3...${NC}"

# Upload de arquivos estáticos com cache longo
echo "Upload de assets (JS, CSS, images)..."
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --exclude "*.html" \
    --include "*.js" \
    --include "*.css" \
    --include "*.png" \
    --include "*.jpg" \
    --include "*.jpeg" \
    --include "*.gif" \
    --include "*.ico" \
    --include "*.svg" \
    --include "*.webp" \
    --include "*.woff" \
    --include "*.woff2" \
    --cache-control "public, max-age=31536000, immutable"

# Upload de HTML sem cache
echo "Upload de HTML files..."
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --include "*.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload de outros arquivos
echo "Upload de outros arquivos..."
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --exclude "*.js" \
    --exclude "*.css" \
    --exclude "*.png" \
    --exclude "*.jpg" \
    --exclude "*.jpeg" \
    --exclude "*.gif" \
    --exclude "*.ico" \
    --exclude "*.svg" \
    --exclude "*.webp" \
    --exclude "*.woff" \
    --exclude "*.woff2" \
    --exclude "*.html" \
    --cache-control "public, max-age=3600"

cd ..

echo -e "${GREEN}3. Configurando permissões do bucket...${NC}"

# Configurar bucket policy para leitura pública
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
            }
        ]
    }'

# Configurar CORS para API calls
aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration '{
        "CORSRules": [
            {
                "AllowedOrigins": ["*"],
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "HEAD"],
                "MaxAgeSeconds": 3000
            }
        ]
    }'

echo -e "${GREEN}4. Invalidando cache do CloudFront...${NC}"

# Invalidar cache do CloudFront
if [ "$CLOUDFRONT_ID" != "E123456789ABCDEF" ]; then
    echo "Invalidando CloudFront distribution: $CLOUDFRONT_ID"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "Invalidation criada: $INVALIDATION_ID"
    
    # Aguardar invalidação completar
    echo "Aguardando invalidação completar..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_ID" \
        --id "$INVALIDATION_ID"
    
    echo -e "${GREEN}Invalidação concluída${NC}"
else
    echo -e "${YELLOW}CloudFront ID não configurado. Pulando invalidação.${NC}"
fi

echo -e "${GREEN}5. Verificando deploy...${NC}"

# Verificar se index.html está acessível
BUCKET_URL="http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BUCKET_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}Deploy verificado com sucesso!${NC}"
    echo -e "${GREEN}URL: $BUCKET_URL${NC}"
else
    echo -e "${RED}Erro: Deploy não acessível (HTTP $HTTP_STATUS)${NC}"
    exit 1
fi

# Mostrar estatísticas do bucket
echo -e "${GREEN}6. Estatísticas do bucket...${NC}"
aws s3 ls "s3://$BUCKET_NAME" --recursive --human-readable --summarize

echo -e "${GREEN}=== Deploy Frontend concluído! ===${NC}"
echo -e "${GREEN}Bucket: s3://$BUCKET_NAME${NC}"
echo -e "${GREEN}URL: $BUCKET_URL${NC}"

if [ "$CLOUDFRONT_ID" != "E123456789ABCDEF" ]; then
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "$CLOUDFRONT_ID" \
        --query 'Distribution.DomainName' \
        --output text)
    echo -e "${GREEN}CloudFront: https://$CLOUDFRONT_DOMAIN${NC}"
fi

echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Configure o domínio no CloudFront"
echo "2. Atualize VITE_API_URL no frontend"
echo "3. Configure SSL no CloudFront"
echo "4. Teste a aplicação completa"
