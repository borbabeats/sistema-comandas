# Guia de Deploy - Sistema de Comandas

Este guia fornece instruções detalhadas para configurar e implantar o Sistema de Comandas no Railway.

## Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Conta no [GitHub](https://github.com/)
- [Node.js](https://nodejs.org/) 18.x ou superior
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/) (para desenvolvimento local)

## Configuração do Ambiente de Desenvolvimento

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/sistema-comandas.git
   cd sistema-comandas
   ```

2. Instale as dependências do backend:
   ```bash
   cd backend
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na pasta `backend` baseado no `.env.example`
   - Configure as variáveis de banco de dados para seu ambiente local

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy no Railway

### 1. Configuração Inicial

1. Faça login na sua conta do [Railway](https://railway.app/)
2. Clique em "New Project" e selecione "Deploy from GitHub repo"
3. Selecione o repositório do projeto

### 2. Configuração do Banco de Dados

1. No painel do Railway, vá para a aba "Database"
2. Clique em "Create New Database" e selecione "PostgreSQL"
3. Após a criação, vá para a aba "Variables" e copie a `DATABASE_URL`

### 3. Configuração das Variáveis de Ambiente

Na aba "Variables" do seu projeto no Railway, adicione as seguintes variáveis:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=sua_url_de_conexao_aqui
JWT_SECRET=uma_chave_secreta_forte
JWT_EXPIRES_IN=1d
```

### 4. Configuração do Build e Deploy

O projeto já está configurado com `railway.toml` e `nixpacks.toml` para automatizar o build e deploy. O Railway usará automaticamente essas configurações.

### 5. Deploy Manual

1. Faça push das alterações para o repositório
2. O Railway irá detectar automaticamente as mudanças e iniciar um novo deploy
3. Acompanhe o progresso na aba "Deployments"

## Solução de Problemas Comuns

### Falha na Conexão com o Banco de Dados

1. Verifique se a `DATABASE_URL` está correta
2. Verifique se o banco de dados está acessível a partir do Railway
3. Verifique os logs de erro no painel do Railway

### Erros de Build

1. Verifique se todas as dependências estão no `package.json`
2. Verifique se o Node.js versão 18.x está sendo usado
3. Verifique os logs de build no painel do Railway

### Erros de Inicialização

1. Verifique se todas as variáveis de ambiente necessárias estão configuradas
2. Verifique se a porta configurada está correta
3. Verifique os logs de erro no painel do Railway

## Rotas da API

- `GET /health` - Verifica se a API está online
- `GET /test-db` - Testa a conexão com o banco de dados
- `GET /api/...` - Rotas da API (consulte a documentação da API para mais detalhes)

## Monitoramento

O projeto inclui logs detalhados para ajudar na depuração. Você pode visualizar os logs em tempo real no painel do Railway na aba "Logs".

## Atualizações

Para atualizar o projeto após fazer alterações:

1. Faça commit e push das alterações para o repositório
2. O Railway irá detectar as mudanças e iniciar um novo deploy automaticamente

## Segurança

- Nunca exponha credenciais ou chaves secretas no código-fonte
- Use variáveis de ambiente para armazenar informações sensíveis
- Ative o SSL/TLS nas configurações do Railway
- Mantenha as dependências atualizadas
