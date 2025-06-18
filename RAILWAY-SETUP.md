# Configuração do Projeto no Railway

Este guia explica como configurar as variáveis de ambiente necessárias para o deploy do projeto no Railway.

## Variáveis de Ambiente Obrigatórias

### Configuração do Banco de Dados

1. **DATABASE_URL** (Recomendado para produção)
   - Fornecido automaticamente pelo serviço de banco de dados do Railway
   - Formato: `postgresql://user:password@host:port/dbname?sslmode=require`
   - **OBS**: Esta é a forma recomendada de configurar o banco de dados em produção

2. **Configuração Manual (Alternativa)**
   - `DB_HOST`: Endereço do servidor do banco de dados
   - `DB_PORT`: Porta do banco de dados (padrão: 5432)
   - `DB_USERNAME`: Nome de usuário do banco de dados
   - `DB_PASSWORD`: Senha do banco de dados
   - `DB_NAME`: Nome do banco de dados

### Configuração do Servidor

- `PORT`: Porta em que o servidor irá rodar (padrão: 3000)
- `NODE_ENV`: Ambiente de execução (production, development, test)

### Segurança

- `JWT_SECRET`: Chave secreta para assinatura de tokens JWT
- `JWT_EXPIRES_IN`: Tempo de expiração dos tokens JWT (ex: 1d, 7d)

## Como Configurar no Painel do Railway

1. Acesse o painel do Railway
2. Selecione seu projeto
3. Vá até a aba "Variables"
4. Adicione as variáveis necessárias conforme listado acima
5. Clique em "Save Changes"

## Configuração Recomendada para Produção

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
JWT_SECRET=uma_chave_secreta_forte_aqui
JWT_EXPIRES_IN=1d
```

## Solução de Problemas

- **Erro de conexão com o banco de dados**: Verifique se a `DATABASE_URL` está correta e se o banco de dados está acessível
- **Erro de porta em uso**: Verifique se a porta especificada não está sendo usada por outro serviço
- **Erro de autenticação**: Verifique se as credenciais do banco de dados estão corretas
