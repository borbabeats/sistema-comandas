const { DataSource } = require("typeorm");
const { Plate } = require("../src/entities/Plate");
const { Dessert } = require("../src/entities/Dessert");
const { Beverage } = require("../src/entities/Beverage");
const { User } = require("../src/entities/User");
const { Order } = require("../src/entities/Order");

function getDatabaseConfig() {
  // Configuração padrão para desenvolvimento local com Docker
  const defaultConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'comandas',
    ssl: false
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