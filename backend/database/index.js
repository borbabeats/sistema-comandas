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
  
  // Log das variáveis de ambiente para depuração
  console.log('=== Configuração do Banco de Dados ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT || '3000 (padrão)');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '*** Configurado ***' : 'Não configurado');
  
  // Log das variáveis de ambiente do Railway
  console.log('\n=== Variáveis do Railway ===');
  console.log('DB_USER:', process.env.DB_USER ? '***' : 'Não configurado');
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'Não configurado');
  console.log('DB_NAME:', process.env.DB_NAME || 'Não configurado');
  
  // Log de todas as variáveis de ambiente (útil para depuração)
  console.log('\n=== Todas as Variáveis de Ambiente ===');
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('DB_') || key.startsWith('PG') || key === 'NODE_ENV' || key === 'PORT' || key === 'DATABASE_URL') {
      console.log(`${key}:`, key.includes('PASS') || key === 'DB_PASSWORD' || key === 'DB_USER' ? '***' : process.env[key]);
    }
  });

  // Configuração para produção (usando DATABASE_URL)
  if (isProduction) {
    if (process.env.DATABASE_URL) {
      console.log('Usando configuração de produção com DATABASE_URL');
      
      // Se a DATABASE_URL contiver placeholders, substitua-os pelos valores reais
      let databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl.includes('${')) {
        console.log('Substituindo placeholders na DATABASE_URL');
        // Tenta usar PGHOST se existir, senão tenta localhost (padrão do Railway)
        const dbHost = process.env.PGHOST || 'localhost';
        databaseUrl = databaseUrl
          .replace('${DB_USER}', process.env.DB_USER || '')
          .replace('${DB_PASSWORD}', process.env.DB_PASSWORD || '')
          .replace('${PGHOST}', dbHost)
          .replace('${DB_NAME}', process.env.DB_NAME || 'comandas');
        console.log('DATABASE_URL após substituição:', databaseUrl.replace(/:([^:]+)@/, ':***@'));
      }
      
      return {
        type: 'postgres',
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
        extra: {
          ssl: { rejectUnauthorized: false }
        },
        synchronize: false,
        logging: true,
        entities: [
          'dist/entities/**/*.js'
        ],
        migrations: [
          'dist/migrations/**/*.js'
        ]
      };
    }
    
    // Se não tiver DATABASE_URL, tenta usar as variáveis individuais do Railway
    console.log('Usando configuração de produção com variáveis individuais do Railway');
    const dbConfig = {
      type: 'postgres',
      host: 'postgres_db', // Nome do container do PostgreSQL
      port: parseInt(process.env.PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'sistema_comandas',
      ssl: { rejectUnauthorized: false },
      extra: {
        ssl: { rejectUnauthorized: false }
      },
      synchronize: false,
      logging: true,
      entities: [
        'dist/entities/**/*.js'
      ],
      migrations: [
        'dist/migrations/**/*.js'
      ]
    };
    
    console.log('Configuração do banco de dados (sem senha):', {
      ...dbConfig,
      password: '***',
      extra: { ssl: { rejectUnauthorized: false } }
    });
    
    return dbConfig;
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
