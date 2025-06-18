# Estágio de construção
FROM node:16 AS builder

WORKDIR /usr/src/app

# Copiar package.json e package-lock.json
COPY backend/package*.json ./

# Copiar os arquivos de configuração do TypeScript
COPY backend/tsconfig*.json ./

# Copiar os arquivos de migração
COPY backend/src/migrations ./src/migrations

# Instalar dependências
RUN npm install

# Copiar o restante dos arquivos do backend
COPY backend/ .

# Compilar TypeScript
RUN npm run build

# Estágio de produção
FROM node:16-alpine

WORKDIR /usr/src/app

# Copiar package.json e package-lock.json
COPY backend/package*.json ./

# Instalar apenas as dependências de produção
RUN npm install --only=production

# Copiar os arquivos compilados do estágio builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/migrations ./src/migrations

# Porta que a aplicação irá rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"]
