import * as path from 'path';
import * as fs from 'fs';
import { AppDataSource } from '../config/database';
import { Beverage } from '../entities/Beverage';
import { Dessert } from '../entities/Dessert';
import { Plate } from '../entities/Plate';

async function seed() {
  console.log('Starting database seeding...');
  
  // Inicializa a conexão com o banco de dados
  console.log('Initializing database connection...');
  await AppDataSource.initialize();
  
  // Obtém o repositório de conexão para executar queries SQL diretas
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    console.log('Connected to the database');
    
    // Lê os dados dos arquivos JSON
    const beveragesPath = path.join(__dirname, '../../beverages.json');
    const dessertsPath = path.join(__dirname, '../../desserts.json');
    const platesPath = path.join(__dirname, '../../plates.json');
    
    const beveragesData = JSON.parse(fs.readFileSync(beveragesPath, 'utf-8'));
    const dessertsData = JSON.parse(fs.readFileSync(dessertsPath, 'utf-8'));
    const platesData = JSON.parse(fs.readFileSync(platesPath, 'utf-8'));
    
    console.log(`Found ${beveragesData.length} beverages, ${dessertsData.length} desserts, and ${platesData.length} plates to seed`);
    
    // Limpa as tabelas
    console.log('Clearing existing data...');
    await queryRunner.query('TRUNCATE TABLE beverages, desserts, plates CASCADE');
    
    // Insere as bebidas
    console.log('Seeding beverages...');
    const beverageRepository = AppDataSource.getRepository(Beverage);
    for (const beverage of beveragesData) {
      const newBeverage = beverageRepository.create({
        name: beverage.name,
        description: beverage.description,
        price: beverage.price,
        type: beverage.type,
        info: beverage.info
      });
      await beverageRepository.save(newBeverage);
      console.log(`Added beverage: ${beverage.name}`);
    }
    
    // Insere as sobremesas
    // Insere as sobremesas
    console.log('Seeding desserts...');
    const dessertRepository = AppDataSource.getRepository(Dessert);
    for (const dessert of dessertsData) {
      const newDessert = dessertRepository.create({
        name: dessert.name,
        description: dessert.description,
        price: dessert.price,
        info: dessert.info
      });
      await dessertRepository.save(newDessert);
      console.log(`Added dessert: ${dessert.name}`);
    }
    
    // Insere os pratos
    console.log('Seeding plates...');
    const plateRepository = AppDataSource.getRepository(Plate);
    for (const plate of platesData) {
      const newPlate = plateRepository.create({
        name: plate.name,
        description: plate.description,
        price: plate.price,
        info: plate.info,
        type: Array.isArray(plate.type) ? plate.type : [plate.type].filter(Boolean)
      });
      await plateRepository.save(newPlate);
      console.log(`Added plate: ${plate.name}`);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Fecha a conexão com o banco de dados
    if (AppDataSource.isInitialized) {
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Executa o script
seed().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
