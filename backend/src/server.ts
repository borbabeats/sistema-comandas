import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import routes from './routes';
import dotenv from 'dotenv';
// Importações necessárias

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Exibe as variáveis de ambiente carregadas (exceto valores sensíveis)
console.log('=== Ambiente ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST ? '***' : 'Não configurado');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '***' : 'Não configurado');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: [
    'https://sistema-comandas-sage.vercel.app',
    'http://localhost:3000',  // For local development
    'http://localhost:5000'   // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api', routes);

// Rota para testar conexão com o banco de dados
app.get('/test-db', async (_req, res) => {
  try {
    await initializeDatabase();
    res.status(200).json({ 
      status: 'success', 
      message: 'Conexão com o banco de dados estabelecida com sucesso',
      database: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'sistema_comandas',
        port: process.env.DB_PORT || 5432
      }
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão com o banco de dados:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Falha ao conectar ao banco de dados',
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
});

// Iniciar servidor
const startServer = async () => {
  console.log('\n=== Iniciando servidor ===');
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Diretório de trabalho: ${process.cwd()}`);
  
  try {
    console.log('\nInicializando conexão com o banco de dados...');
    await initializeDatabase();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
      console.log(`📡 API disponível em http://localhost:${PORT}/api`);
      console.log(`🩺 Health check em http://localhost:${PORT}/health`);
      console.log(`🔍 Teste de banco de dados em http://localhost:${PORT}/test-db`);
      
      // Log de rotas disponíveis
      console.log('\n🛣️  Rotas disponíveis:');
      console.log('  GET    /health');
      console.log('  GET    /test-db');
      console.log('  *      /api/* (rotas da API)');
    });

    // Tratamento de erros não capturados
    process.on('unhandledRejection', (reason, _promise) => {
      console.error('⚠️  Erro não tratado:');
      console.error(reason);
      // Encerra o servidor em caso de erro não tratado
      server.close(() => process.exit(1));
    });

  } catch (error: any) {
    console.error('❌ Falha ao iniciar o servidor:');
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 Erro: Não foi possível conectar ao banco de dados');
      console.error('Verifique se o servidor PostgreSQL está em execução e acessível');
      console.error('Host:', process.env.DB_HOST || 'localhost');
      console.error('Porta:', process.env.DB_PORT || 5432);
    } else if (error.code === '3D000') {
      console.error('\n🔴 Erro: Banco de dados não encontrado');
      console.error('Verifique se o banco de dados existe e está acessível');
      console.error('Banco de dados:', process.env.DB_NAME || 'sistema_comandas');
    } else if (error.code === '28P01') {
      console.error('\n🔴 Erro: Falha na autenticação');
      console.error('Verifique o nome de usuário e senha do banco de dados');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\n🔴 Erro: Não foi possível resolver o endereço do host do banco de dados');
      console.error('Verifique se o host do banco de dados está correto');
    }
    
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();
