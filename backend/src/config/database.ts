import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';

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
  console.log('\n=== Configuração do Banco de Dados ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '*** Configurado ***' : 'Não configurado');
  console.log('DB_HOST:', process.env.DB_HOST || 'localhost (padrão)');
  console.log('DB_NAME:', process.env.DB_NAME || 'sistema_comandas (padrão)');
  
  // Configuração para produção (usando DATABASE_URL)
  if (isProduction && process.env.DATABASE_URL) {
    console.log('Usando configuração de produção com DATABASE_URL');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      extra: {
        ssl: { rejectUnauthorized: false }
      }
    };
  }

  // Configuração para desenvolvimento local
  console.log('Usando configuração de desenvolvimento local');
  const config: DatabaseConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_comandas',
    ssl: false
  };

  // Log da configuração (sem senha)
  console.log('\nConfiguração do banco de dados:');
  console.log('- Host:', config.host);
  console.log('- Porta:', config.port);
  console.log('- Usuário:', config.username);
  console.log('- Senha:', config.password ? '***' : 'não definida');
  console.log('- Banco de dados:', config.database);
  console.log('- SSL:', 'desativado');

  return config;
}

// Obtém a configuração do banco de dados
const dbConfig = getDatabaseConfig();

// Cria a fonte de dados do TypeORM
export const AppDataSource = new DataSource({
  ...dbConfig,
  entities: [
    User, 
    Plate, 
    Dessert, 
    Beverage, 
    Order
  ],
  synchronize: process.env.NODE_ENV !== 'production', // Desativar em produção
  logging: process.env.NODE_ENV === 'development',
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  // Configurações adicionais de pool de conexão
  poolSize: 10,
  maxQueryExecutionTime: 10000, // 10 segundos
  connectTimeoutMS: 10000, // 10 segundos
  applicationName: 'sistema-comandas-api',
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
    console.log('\n🔌 Conectando ao banco de dados...');
    
    // Verifica se já está conectado
    if (AppDataSource.isInitialized) {
      console.log('✅ Já conectado ao banco de dados');
      return AppDataSource;
    }
    
    // Tenta conectar
    const dataSource = await AppDataSource.initialize();
    
    // Testa a conexão com uma consulta simples
    await dataSource.query('SELECT 1');
    
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    reconnectionAttempts = 0; // Reseta o contador de tentativas
    
    return dataSource;
  } catch (error: any) {
    reconnectionAttempts++;
    
    // Log detalhado do erro
    console.error('\n❌ Erro ao conectar ao banco de dados:');
    console.error('Código:', error.code || 'N/A');
    console.error('Mensagem:', error.message);
    
    // Tratamento de erros comuns
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 Erro: Conexão recusada pelo servidor do banco de dados');
      console.error('Verifique se o servidor PostgreSQL está em execução e acessível');
      console.error(`Host: ${dbConfig.host || 'localhost'}, Porta: ${dbConfig.port || 5432}`);
    } else if (error.code === '3D000') {
      console.error('\n🔴 Erro: Banco de dados não encontrado');
      console.error(`Verifique se o banco de dados "${dbConfig.database}" existe`);
    } else if (error.code === '28P01') {
      console.error('\n🔴 Erro: Falha na autenticação');
      console.error('Verifique o nome de usuário e senha do banco de dados');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\n🔴 Erro: Não foi possível resolver o endereço do host do banco de dados');
      console.error('Verifique se o host do banco de dados está correto');
    }
    
    // Tenta reconectar se ainda não excedeu o número máximo de tentativas
    if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      const delay = Math.pow(2, reconnectionAttempts) * 1000; // Backoff exponencial
      console.log(`\n🔄 Tentando reconectar em ${delay/1000} segundos (${reconnectionAttempts + 1}/${MAX_RECONNECTION_ATTEMPTS})...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeDatabase(); // Tenta novamente
    }
    
    // Se excedeu o número máximo de tentativas, lança o erro
    console.error(`\n❌ Número máximo de tentativas de conexão (${MAX_RECONNECTION_ATTEMPTS}) excedido`);
    throw error;
  }
};

// Exporta a função para testar a conexão com o banco de dados
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const dataSource = await initializeDatabase();
    await dataSource.destroy();
    return true;
  } catch (error) {
    console.error('❌ Falha ao testar a conexão com o banco de dados:', error);
    return false;
  }
};
