# Monorepo Architecture - Sistema de Comandas

## Overview
Arquitetura monorepo para deploy em AWS com:
- **EC2**: Backend API + PostgreSQL (Docker)
- **S3**: Frontend estático
- **CloudFront**: CDN + SSL

## Estrutura do Monorepo

```
sistema-comandas/
|-- .env.example                    # Template variáveis ambiente
|-- .env.production.example         # Template produção EC2
|-- docker-compose.yml              # Desenvolvimento local
|-- docker-compose.prod.yml         # Produção EC2
|-- docker/                         # Configurações Docker
|   |-- sql/                        # Scripts SQL + dados
|   |-- .dockerignore
|-- backend/                        # API Node.js/TypeScript
|   |-- src/                        # Código fonte
|   |-- Dockerfile                  # Build produção
|   |-- .dockerignore
|   |-- package.json
|   |-- tsconfig.json
|-- frontend/                       # React/TypeScript
|   |-- src/                        # Código fonte
|   |-- Dockerfile                  # Build estático
|   |-- nginx.conf                  # Config Nginx
|   |-- .dockerignore
|   |-- package.json
|   |-- vite.config.ts
|-- scripts/                        # Scripts deploy
|   |-- deploy-ec2.sh              # Deploy backend EC2
|   |-- deploy-s3.sh               # Deploy frontend S3
|   |-- setup-ec2.sh               # Setup inicial EC2
|-- docs/                          # Documentação
|   |-- aws-deploy.md              # Deploy AWS
|   |-- api-documentation.md       # API docs
`-- README.md                      # Documentação geral
```

## Fluxo de Deploy

### 1. Backend (EC2)
```bash
# Build e deploy backend
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend db
```

### 2. Frontend (S3 + CloudFront)
```bash
# Build e deploy frontend
cd frontend
npm run build
aws s3 sync dist/ s3://bucket-name --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

## Vantagens do Monorepo

### **Desenvolvimento**
- **Dependências compartilhadas**: TypeScript, ESLint, configs
- **CI/CD simplificado**: Pipeline único
- **Code sharing**: Tipos, utils, interfaces
- **Atomic commits**: Mudanças frontend + backend juntos

### **Deploy**
- **Versionamento sincronizado**: Frontend e backend sempre compatíveis
- **Rollback coordenado**: Reverter versão completa
- **Testes integrados**: E2E tests entre frontend/backend
- **Documentação centralizada**: API docs sempre atualizados

### **Manutenção**
- **Single source of truth**: Um repositório para tudo
- **Ferramentas unificadas**: Linting, formatação, testing
- **Onboarding simples**: Clone único repo
- **Debugging integrado**: Frontend + backend no mesmo workspace

## Configuração de Ambiente

### **Desenvolvimento Local**
```bash
# Clone repo
git clone <repo-url>
cd sistema-comandas

# Setup ambiente
cp .env.example .env
docker compose up -d

# Acessar serviços
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Adminer: http://localhost:8080
```

### **Produção EC2**
```bash
# Setup EC2
./scripts/setup-ec2.sh

# Deploy backend
./scripts/deploy-ec2.sh

# Deploy frontend
./scripts/deploy-s3.sh
```

## Variáveis de Ambiente

### **Backend (.env.production)**
```bash
# Database
DB_USER=admin
DB_PASSWORD=pa&@)s28
DB_NAME=comandas
DB_HOST=postgres_db

# API
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Frontend URLs
FRONTEND_URL=https://your-domain.s3.amazonaws.com
CLOUDFRONT_DOMAIN=https://your-domain.cloudfront.net
```

### **Frontend (.env.production)**
```bash
VITE_API_URL=https://your-ec2-domain.com:5000
VITE_WS_URL=wss://your-ec2-domain.com:5000
VITE_ENVIRONMENT=production
```

## Deploy Pipeline

### **GitHub Actions (Exemplo)**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to EC2
        run: ./scripts/deploy-ec2.sh

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Deploy
        run: |
          cd frontend
          npm ci
          npm run build
          aws s3 sync dist/ s3://bucket
          aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

## Segurança

### **EC2 Security Group**
```bash
# Inbound rules
- Port 22 (SSH): Your IP only
- Port 5000 (API): CloudFront IPs only
- Port 5432 (PostgreSQL): Container network only
```

### **S3 + CloudFront**
```bash
# S3: Private bucket + OAI
# CloudFront: HTTPS + WAF rules
# Headers: Security headers via nginx.conf
```

## Monitoramento

### **Backend**
- **Logs**: Winston + CloudWatch
- **Health checks**: `/health` endpoint
- **Metrics**: CPU, Memory, Connections

### **Frontend**
- **CloudFront metrics**: Cache hit ratio, errors
- **S3 metrics**: Storage, requests
- **User analytics**: Via frontend

## Escalabilidade

### **Horizontal Scaling**
```bash
# EC2 Auto Scaling
# Load Balancer + Multiple instances
# Database: RDS PostgreSQL
# Cache: ElastiCache Redis
```

### **Vertical Scaling**
```bash
# EC2 instance types
# Database: RDS instance upgrade
# CDN: CloudFront edge locations
```

## Backup e Recovery

### **Database**
```bash
# Automated backups: pg_dump
# Point-in-time recovery
# Cross-region replication
```

### **Frontend**
```bash
# S3 versioning
# CloudFront invalidation cache
# Rollback via previous build
```

## Troubleshooting

### **Common Issues**
1. **WebSocket não conecta**: Verificar WSS URL + CORS
2. **Database connection**: Senha + network
3. **CORS errors**: Headers CloudFront
4. **Build fails**: Dependências + TypeScript

### **Debug Commands**
```bash
# Check containers
docker compose ps
docker logs <container>

# Check network
docker network ls
docker exec backend ping postgres_db

# Check frontend
curl -I https://your-domain.cloudfront.net
```

## Best Practices

### **Code Organization**
- **Shared types**: `/types/` directory
- **Common utils**: `/utils/` directory
- **Environment configs**: `.env.example`
- **Documentation**: `docs/` directory

### **Git Workflow**
- **Feature branches**: `feature/new-endpoint`
- **PR reviews**: Code + documentation
- **Semantic versioning**: Major.Minor.Patch
- **Tag releases**: `v1.0.0`

### **Performance**
- **Bundle optimization**: Tree shaking
- **Image optimization**: WebP + lazy loading
- **API caching**: Redis layer
- **CDN caching**: Long cache for assets

## Conclusão

Esta arquitetura monorepo oferece:
- **Simplicidade**: Um repositório, um pipeline
- **Flexibilidade**: Deploy independente frontend/backend
- **Escalabilidade**: AWS services ready
- **Manutenibilidade**: Código e docs centralizados

Ideal para equipes pequenas/médias que querem:
- Deploy rápido e confiável
- Desenvolvimento integrado
- Baixo overhead operacional
- Alta disponibilidade
