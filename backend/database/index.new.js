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
  
  // Log para depuração (não mostrar em produção)
  if (!isProduction) {
    console.log('=== Configuração do Banco de Dados ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '*** Configurado ***' : 'Não configurado');
  }
  
  // Configuração para Railway (usando DATABASE_URL)
  if (process.env.DATABASE_URL) {
    const sslConfig = isProduction ? { rejectUnauthorized: false } : false;
    
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: sslConfig,
      extra: {
        ssl: sslConfig ? { rejectUnauthorized: false } : undefined
      },
      synchronize: false,
      logging: !isProduction,
      entities: [
        'src/entities/**/*.js',
        'dist/entities/**/*.js'
      ],
      migrations: [
        'src/migrations/**/*.js',
        'dist/migrations/**/*.js'
      ],
      cli: {
        entitiesDir: 'src/entities',
        migrationsDir: 'src/migrations'
      }
    };
  }

  // Configuração para desenvolvimento local
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_comandas',
    synchronize: false,
    logging: !isProduction,
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
    ssl: isProduction ? { rejectUnauthorized: false } : false
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
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  })
  .catch((error) => {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  });

module.exports = AppDataSource;
