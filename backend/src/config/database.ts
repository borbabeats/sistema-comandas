import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';

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
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10),
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
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_comandas',
    ssl: false
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
