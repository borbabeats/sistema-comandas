import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Dessert } from '../entities/Dessert';
import { validate, IsString, IsNumber, IsOptional, IsNotEmpty, IsPositive } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { handleError } from './index';

const router = Router();

// DTO para criação de sobremesas
class CreateDessertDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be a positive number' })
  price!: number;

  @IsString()
  @IsOptional()
  info?: string;
}

// DTO para atualização de sobremesas
class UpdateDessertDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be a positive number' })
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  info?: string;
}

// Middleware para validação de DTOs
const validateRequest = <T extends object>(dtoClass: new () => T) => {
  return async (req: any, res: any, next: Function) => {
    try {
      const dto = plainToInstance(dtoClass, req.body);
      const errors = await validate(dto as object);
      
      if (errors.length > 0) {
        const errorMessages = errors.flatMap(error => 
          error.constraints ? Object.values(error.constraints) : []
        );
        return res.status(400).json({ errors: errorMessages });
      }

      req.validatedBody = dto;
      next();
    } catch (error) {
      handleError(res, error, 'Falha na validação dos dados');
    }
  };
};

// Criar uma nova sobremesa
router.post<{}, {}, CreateDessertDto>('/', validateRequest(CreateDessertDto), async (req, res) => {
  try {
    const { name, description, price, info } = req.validatedBody as CreateDessertDto;
    
    const dessert = new Dessert();
    dessert.name = name;
    dessert.description = description;
    dessert.price = price;
    if (info) dessert.info = info;
    
    const savedDessert = await AppDataSource.getRepository(Dessert).save(dessert);
    res.status(201).json(savedDessert);
  } catch (error) {
    handleError(res, error, 'Falha ao criar sobremesa');
  }
});

// Listar todas as sobremesas
router.get('/', async (_req, res) => {
  try {
    const desserts = await AppDataSource.getRepository(Dessert).find();
    res.json(desserts);
  } catch (error) {
    handleError(res, error, 'Falha ao listar sobremesas');
  }
});

// Buscar uma sobremesa por ID
router.get<{ id: string }>('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const dessert = await AppDataSource.getRepository(Dessert).findOne({ where: { id } });
    if (!dessert) {
      res.status(404).json({ message: 'Sobremesa não encontrada' });
      return;
    }

    res.json(dessert);
  } catch (error) {
    handleError(res, error, 'Falha ao buscar sobremesa');
  }
});

// Atualizar uma sobremesa
router.patch<{ id: string }, {}, UpdateDessertDto>('/:id', validateRequest(UpdateDessertDto), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const dessert = await AppDataSource.getRepository(Dessert).findOne({ where: { id } });
    if (!dessert) {
      res.status(404).json({ message: 'Sobremesa não encontrada' });
      return;
    }

    const { name, description, price, info } = req.validatedBody as UpdateDessertDto;

    if (name !== undefined) dessert.name = name;
    if (description !== undefined) dessert.description = description;
    if (price !== undefined) dessert.price = price;
    if (info !== undefined) dessert.info = info;

    const updatedDessert = await AppDataSource.getRepository(Dessert).save(dessert);
    res.json(updatedDessert);
  } catch (error) {
    handleError(res, error, 'Falha ao atualizar sobremesa');
  }
});

// Deletar uma sobremesa
router.delete<{ id: string }>('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const dessert = await AppDataSource.getRepository(Dessert).findOne({ where: { id } });
    if (!dessert) {
      res.status(404).json({ message: 'Sobremesa não encontrada' });
      return;
    }

    await AppDataSource.getRepository(Dessert).remove(dessert);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Falha ao deletar sobremesa');
  }
});

export default router;
