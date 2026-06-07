import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';
import { logInfo, logError } from '../config/logger';

// Interface para tipagem da configuração do banco de dados
interface DatabaseConfig {
  type: 'postgres';
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  extra?: {
    ssl?: { rejectUnauthorized: boolean };
  };
}

/**
 * Obtém a configuração do banco de dados com base nas variáveis de ambiente
 */
function getDatabaseConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log das variáveis de ambiente para depuração
  logInfo('=== Configuração do Banco de Dados ===', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || '3000 (padrão)',
    DATABASE_URL: process.env.DATABASE_URL ? '*** Configurado ***' : 'Não configurado',
    DB_USER: process.env.DB_USER ? '***' : 'Não configurado',
    DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'Não configurado',
    DB_NAME: process.env.DB_NAME || 'Não configurado',
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD_STATUS: process.env.DB_PASSWORD ? 'DEFINIDA' : 'NÃO DEFINIDA',
  });

  // Configuração para produção (usando DATABASE_URL ou variáveis individuais)
  if (isProduction) {
    if (process.env.DATABASE_URL) {
      logInfo('Usando configuração de produção com DATABASE_URL');
      
      // Se a DATABASE_URL contiver placeholders, substitua-os pelos valores reais
      let databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl.includes('${')) {
        logInfo('Substituindo placeholders na DATABASE_URL');
        // Tenta usar PGHOST se existir, senão tenta localhost (padrão do Railway)
        const dbHost = process.env.PGHOST || 'localhost';
        databaseUrl = databaseUrl
          .replace('${DB_USER}', process.env.DB_USER || '')
          .replace('${DB_PASSWORD}', process.env.DB_PASSWORD || '')
          .replace('${PGHOST}', dbHost)
          .replace('${DB_NAME}', process.env.DB_NAME || 'comandas');
        logInfo('DATABASE_URL após substituição', { url: databaseUrl.replace(/:([^:]+)@/, ':***@') });
      }
      
      return {
        type: 'postgres',
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
        extra: {
          ssl: { rejectUnauthorized: false }
        }
      };
    }
    
    // Se não tiver DATABASE_URL, tenta usar as variáveis individuais do Railway
    logInfo('Usando configuração de produção com variáveis individuais do Railway');
    const dbConfig: DatabaseConfig = {
      type: 'postgres',
      host: 'postgres_db', // Nome do container do PostgreSQL
      port: parseInt(process.env.PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'sistema_comandas',
      ssl: { rejectUnauthorized: false },
      extra: {
        ssl: { rejectUnauthorized: false }
      }
    };
    
    logInfo('Configuração do banco de dados (sem senha)', {
      ...dbConfig,
      password: '***',
      extra: { ssl: { rejectUnauthorized: false } }
    });
    
    return dbConfig;
  }

  // Configuração para desenvolvimento local
  logInfo('Usando configuração de desenvolvimento local');
  const config: DatabaseConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'comandas',
    ssl: false
  };

  // Log da configuração (sem senha)
  logInfo('Configuração do banco de dados', {
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password ? '***' : 'não definida',
    database: config.database,
    ssl: 'desativado'
  });

  return config;
}

// DataSource criado de forma lazy para garantir que dotenv já foi carregado
let _appDataSource: DataSource | null = null;

export function getAppDataSource(): DataSource {
  if (!_appDataSource) {
    const dbConfig = getDatabaseConfig();
    _appDataSource = new DataSource({
      ...dbConfig,
      entities: [User, Plate, Dessert, Beverage, Order],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      migrations: ['src/migrations/*.ts'],
      subscribers: [],
      poolSize: 10,
      maxQueryExecutionTime: 10000,
      connectTimeoutMS: 10000,
      applicationName: 'sistema-comandas-api',
    });
  }
  return _appDataSource;
}

// Compatibilidade com código existente que usa AppDataSource
export const AppDataSource = new Proxy({} as DataSource, {
  get(_target, prop) {
    const ds = getAppDataSource();
    const val = (ds as any)[prop];
    return typeof val === 'function' ? val.bind(ds) : val;
  }
});

// Contador de tentativas de reconexão
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

/**
 * Inicializa a conexão com o banco de dados
 * @returns Promise<DataSource> A fonte de dados inicializada
 * @throws Error Se não for possível conectar ao banco de dados
 */
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    logInfo('Conectando ao banco de dados...');
    
    // Verifica se já está conectado
    if (AppDataSource.isInitialized) {
      logInfo('Já conectado ao banco de dados');
      return AppDataSource;
    }
    
    // Tenta conectar
    const dataSource = await AppDataSource.initialize();
    
    // Testa a conexão com uma consulta simples
    await dataSource.query('SELECT 1');
    
    logInfo('Conexão com o banco de dados estabelecida com sucesso!');
    reconnectionAttempts = 0; // Reseta o contador de tentativas
    
    return dataSource;
  } catch (error: any) {
    reconnectionAttempts++;
    
    // Log detalhado do erro
    const ds = getAppDataSource() as any;
    logError('Erro ao conectar ao banco de dados', error, {
      errorCode: error.code || 'N/A',
      errorMessage: error.message,
      errorType: error.code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' :
                error.code === '3D000' ? 'DATABASE_NOT_FOUND' :
                error.code === '28P01' ? 'AUTHENTICATION_FAILED' :
                error.message.includes('getaddrinfo ENOTFOUND') ? 'HOST_NOT_FOUND' :
                'UNKNOWN_ERROR',
      host: ds.options?.host || 'localhost',
      port: ds.options?.port || 5432,
      database: ds.options?.database,
      attempt: reconnectionAttempts,
      maxAttempts: MAX_RECONNECTION_ATTEMPTS,
    });
    
    // Tenta reconectar se ainda não excedeu o número máximo de tentativas
    if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      const delay = Math.pow(2, reconnectionAttempts) * 1000; // Backoff exponencial
      logInfo(`Tentando reconectar em ${delay/1000} segundos`, {
        attempt: reconnectionAttempts + 1,
        maxAttempts: MAX_RECONNECTION_ATTEMPTS,
        delay: `${delay}ms`
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeDatabase(); // Tenta novamente
    }
    
    // Se excedeu o número máximo de tentativas, lança o erro
    logError(`Número máximo de tentativas de conexão (${MAX_RECONNECTION_ATTEMPTS}) excedido`, error);
    throw error;
  }
};

// Exporta a função para testar a conexão com o banco de dados
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const dataSource = await initializeDatabase();
    await dataSource.destroy();
    logInfo('Teste de conexão com o banco de dados bem-sucedido');
    return true;
  } catch (error) {
    logError('Falha ao testar a conexão com o banco de dados', error as Error);
    return false;
  }
};
