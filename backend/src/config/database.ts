import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';

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
  const host = process.env.PGHOST || process.env.DB_HOST || 'localhost';
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

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: [User, Plate, Dessert, Beverage, Order],
  synchronize: process.env.NODE_ENV !== 'production', // Desativar em produção
  logging: process.env.NODE_ENV === 'development',
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
    return AppDataSource;
  } catch (error) {
    console.error('Error connecting to the database', error);
    throw error;
  }
};
