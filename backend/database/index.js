const { DataSource } = require("typeorm");
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Entidades
const { Plate } = require("../src/entities/Plate");
const { Dessert } = require("../src/entities/Dessert");
const { Beverage } = require("../src/entities/Beverage");
const { User } = require("../src/entities/User");
const { Order } = require("../src/entities/Order");

function getDatabaseConfig() {
  // Verifica se estamos em produção (Railway ou outro ambiente de produção)
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log para depuração
  console.log('=== Configuração do Banco de Dados ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '*** Configurado ***' : 'Não configurado');
  console.log('DB_HOST:', process.env.DB_HOST || 'Não configurado');
  
  // Configuração para produção (usando DATABASE_URL)
  if (isProduction && process.env.DATABASE_URL) {
    console.log('Usando configuração de produção com DATABASE_URL');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      extra: {
        ssl: { rejectUnauthorized: false }
      },
      synchronize: false,
      logging: false,
      entities: [
        'dist/entities/**/*.js'
      ],
      migrations: [
        'dist/migrations/**/*.js'
      ]
    };
  }

  // Configuração para desenvolvimento local
  console.log('Usando configuração de desenvolvimento local');
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_comandas',
    synchronize: false,
    logging: true,
    entities: [
      'src/entities/**/*.ts',
      'dist/entities/**/*.js'
    ],
    migrations: [
      'src/migrations/**/*.ts',
      'dist/migrations/**/*.js'
    ],
    cli: {
      entitiesDir: 'src/entities',
      migrationsDir: 'src/migrations'
    },
    ssl: false
  };
}

const dbConfig = getDatabaseConfig();

// Log da configuração (sem senha)
console.log('Database connection config:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : undefined,
  url: dbConfig.url ? '***' : undefined
});

const AppDataSource = new DataSource({
  ...dbConfig
});

// Testa a conexão com o banco de dados
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verifica se a conexão está ativa
    return AppDataSource.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✅ Teste de consulta ao banco de dados bem-sucedido:', result[0]);
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('Erro: Não foi possível resolver o endereço do host do banco de dados');
      console.error('Verifique se as configurações de host e porta estão corretas');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Erro: Conexão recusada pelo servidor do banco de dados');
      console.error('Verifique se o servidor PostgreSQL está em execução e acessível');
    } else if (error.code === '28P01') {
      console.error('Erro: Falha na autenticação do usuário');
      console.error('Verifique as credenciais do banco de dados (usuário/senha)');
    } else if (error.code === '3D000') {
      console.error('Erro: Banco de dados não encontrado');
      console.error('Verifique se o banco de dados especificado existe');
    }
    
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });

// Função auxiliar para testar a conexão com o banco de dados
async function testDatabaseConnection() {
  try {
    await AppDataSource.initialize();
    const result = await AppDataSource.query('SELECT NOW()');
    console.log('✅ Teste de conexão com o banco de dados bem-sucedido:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Falha ao testar a conexão com o banco de dados:');
    console.error(error);
    return false;
  } finally {
    // Fecha a conexão após o teste
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

module.exports = { 
  AppDataSource,
  testDatabaseConnection
};
