import 'reflect-metadata';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente ANTES de qualquer outro import que use process.env
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeDatabase } from './config/database';
import routes from './routes';
import { logInfo, logError } from './config/logger';
import { httpLogger, requestLogger, errorLogger, performanceLogger, securityLogger } from './middleware/logging.middleware';
import { socketService } from './config/socket';

// Exibe as variáveis de ambiente carregadas (exceto valores sensíveis)
logInfo('=== Ambiente ===', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST ? '***' : 'Não configurado',
  DATABASE_URL: process.env.DATABASE_URL ? '***' : 'Não configurado',
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.CLOUDFRONT_DOMAIN || 'https://*.cloudfront.net',
    'https://sistema-comandas-sage.vercel.app',
    'http://localhost:3000',  // For local development
    'http://localhost:3001',  // Frontend port
    'http://localhost:5000'   // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(securityLogger);
app.use(httpLogger);
app.use(requestLogger);
app.use(performanceLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorLogger);

// Rota para testar conexão com o banco de dados
app.get('/test-db', async (_req, res) => {
  try {
    await initializeDatabase();
    logInfo('Database connection test successful');
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
    logError('Erro ao testar conexão com o banco de dados', error);
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
  logInfo('=== Iniciando servidor ===', {
    mode: process.env.NODE_ENV || 'development',
    workingDirectory: process.cwd(),
  });
  
  try {
    logInfo('Inicializando conexão com o banco de dados...');
    await initializeDatabase();
    logInfo('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Initialize Socket.IO
    socketService.initialize(server);
    
    server.listen(PORT, () => {
      logInfo('Servidor iniciado com sucesso', {
        url: `http://localhost:${PORT}`,
        apiUrl: `http://localhost:${PORT}/api`,
        healthUrl: `http://localhost:${PORT}/health`,
        testDbUrl: `http://localhost:${PORT}/test-db`,
        availableRoutes: [
          'GET /health',
          'GET /test-db',
          '*/api/* (API routes)',
          'WebSocket: /socket.io/*'
        ],
        socketStats: socketService.getConnectionStats()
      });
    });

    // Tratamento de erros não capturados
    process.on('unhandledRejection', (reason, _promise) => {
      logError('Erro não tratado', reason as Error);
      // Encerra o servidor em caso de erro não tratado
      server.close(() => process.exit(1));
    });

  } catch (error: any) {
    logError('Falha ao iniciar o servidor', error, {
      errorCode: error.code,
      errorMessage: error.message,
      errorType: error.code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' :
                error.code === '3D000' ? 'DATABASE_NOT_FOUND' :
                error.code === '28P01' ? 'AUTHENTICATION_FAILED' :
                error.message.includes('getaddrinfo ENOTFOUND') ? 'HOST_NOT_FOUND' :
                'UNKNOWN_ERROR',
      dbHost: process.env.DB_HOST || 'localhost',
      dbPort: process.env.DB_PORT || 5432,
      dbName: process.env.DB_NAME || 'sistema_comandas',
    });
    process.exit(1);
  }
};

// Inicia o servidor
startServer();
