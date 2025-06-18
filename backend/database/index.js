const { DataSource } = require("typeorm");
const { Plate } = require("../src/entities/Plate");
const { Dessert } = require("../src/entities/Dessert");
const { Beverage } = require("../src/entities/Beverage");
const { User } = require("../src/entities/User");
const { Order } = require("../src/entities/Order");

function getDatabaseConfig() {
  // Configuração para Docker e Railway
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Se estiver no Railway, usa a URL de conexão fornecida por eles
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }

  // Configuração para desenvolvimento local
  const defaultConfig = {
    host: 'localhost',  // Alterado de 'db' para 'localhost' para conectar do host
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'comandas',
    ssl: isProduction ? { rejectUnauthorized: false } : false
  };

  // Log da configuração (sem senha)
  console.log('Database connection config:', {
    
    ...defaultConfig,
    password: defaultConfig.password ? '***' : 'not set'
  });

  return defaultConfig;
}

const dbConfig = getDatabaseConfig();

const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: [Plate, Dessert, Beverage, User, Order].filter(Boolean),
  migrations: ["src/migrations/*.ts"],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === "development",
  migrationsRun: false,
  migrationsTableName: "migrations"
});

module.exports = AppDataSource;