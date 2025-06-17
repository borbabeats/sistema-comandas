const { DataSource } = require("typeorm");
const { Plate } = require("../src/entities/Plate");
const { Dessert } = require("../src/entities/Dessert");
const { Beverage } = require("../src/entities/Beverage");
const { User } = require("../src/entities/User");
const { Order } = require("../src/entities/Order");

function getDatabaseConfig() {
  // Log environment for debugging
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT: !!process.env.RAILWAY_ENVIRONMENT,
    DB_HOST: process.env.DB_HOST,
    PGHOST: process.env.PGHOST,
    DATABASE_URL: process.env.DATABASE_URL ? '***' : 'not set'
  });

  // If running in Railway
  if (process.env.RAILWAY_ENVIRONMENT) {
    // Use Railway's provided connection details
    return {
      host: process.env.PGHOST || process.env.DB_HOST,
      port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
      username: process.env.PGUSER || process.env.DB_USERNAME,
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      database: process.env.PGDATABASE || process.env.DB_NAME || 'railway',
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
      }
    };
  }

  // For local development with DATABASE_URL
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.replace(/^\//, ''), // Remove leading slash
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