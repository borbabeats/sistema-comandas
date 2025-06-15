import { DataSource } from 'typeorm';
import { User, Plate, Dessert, Beverage, Order } from '../entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sistema_comandas',
  entities: [User, Plate, Dessert, Beverage, Order],
  synchronize: true, // Apenas para desenvolvimento - desativar em produção
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
