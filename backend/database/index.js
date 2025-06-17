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
    PGPORT: process.env.PGPORT,
    PGUSER: process.env.PGUSER ? '***' : 'not set',
    PGDATABASE: process.env.PGDATABASE,
    DATABASE_URL: process.env.DATABASE_URL ? '***' : 'not set'
  });

  // If running in Railway
  if (process.env.RAILWAY_ENVIRONMENT) {
    // Use Railway's internal connection details
    const config = {
      host: process.env.PGHOST || process.env.DB_HOST,
      port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
      username: process.env.PGUSER || process.env.DB_USERNAME,
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      database: process.env.PGDATABASE || process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    console.log('Database connection config:', {
      ...config,
      password: '***',
      ssl: '***'
    });
    
    return config;
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
  const host = process.env.PGHOST || process.env.DB_HOST || 
    (process.env.DOCKER === 'true' ? 'db' : 'localhost');
    
  console.log('Using database host (fallback):', host);
    
  return {
    host,
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    username: process.env.PGUSER || process.env.DB_USERNAME || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'sistema_comandas',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      sslmode: 'require'
    } : false
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