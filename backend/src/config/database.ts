import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';

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
