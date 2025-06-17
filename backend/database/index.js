const { DataSource } = require("typeorm");
const { Plate } = require("../src/entities/Plate");
const { Dessert } = require("../src/entities/Dessert");
const { Beverage } = require("../src/entities/Beverage");
const { User } = require("../src/entities/User");
const { Order } = require("../src/entities/Order");

function getDatabaseConfig() {
  // For Railway's PostgreSQL
  if (process.env.RAILWAY_ENVIRONMENT) {
    return {
      host: process.env.DB_HOST || 'nozomi.proxy.rlwy.net',
      port: parseInt(process.env.DB_PORT || '32653', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'railway',
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
      }
    };
  }

  // If DATABASE_URL is provided, parse it
  if (process.env.DATABASE_URL) {
    const { hostname, port, username, password, pathname } = new URL(process.env.DATABASE_URL);
    return {
      host: hostname,
      port: parseInt(port, 10),
      username,
      password,
      database: pathname.replace(/^\//, ''), // Remove leading slash
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        sslmode: 'require'
      } : false
    };
  }

  // Fall back to individual environment variables for local development
  return {
    host: process.env.DB_HOST || (process.env.DOCKER === 'true' ? 'db' : 'localhost'),
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_comandas',
    ssl: false
  };
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