import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';

function getDatabaseConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Se estiver em produção e tiver a URL do banco (ex: Railway, Heroku)
  if (isProduction && process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }

  // Configuração para desenvolvimento local
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'comandas',
    ssl: isProduction ? { rejectUnauthorized: false } : false
  };

  // Log da configuração (sem senha)
  console.log('Database connection config:', {
    ...config,
    password: config.password ? '***' : 'not set',
    ssl: isProduction ? 'enabled' : 'disabled'
  });

  return config;
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
