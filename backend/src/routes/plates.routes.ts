import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Plate, FoodType } from '../entities/Plate';
import { validate, IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, IsPositive } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { handleError } from './index';

const router = Router();

// DTO para criação de pratos
class CreatePlateDto {
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

  @IsEnum(FoodType, { message: 'Invalid food type' })
  @IsNotEmpty({ message: 'Type is required' })
  type!: FoodType;
}

// DTO para atualização de pratos
class UpdatePlateDto {
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

  @IsEnum(FoodType, { message: 'Invalid food type' })
  @IsOptional()
  type?: FoodType;
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

// Criar um novo prato
router.post<{}, {}, CreatePlateDto>('/', validateRequest(CreatePlateDto), async (req, res) => {
  try {
    const { name, description, price, info, type } = req.validatedBody as CreatePlateDto;
    
    const plate = new Plate();
    plate.name = name;
    plate.description = description;
    plate.price = price;
    if (info) plate.info = info;
    plate.type = type;
    
    const savedPlate = await AppDataSource.getRepository(Plate).save(plate);
    res.status(201).json(savedPlate);
  } catch (error) {
    handleError(res, error, 'Falha ao criar prato');
  }
});

// Listar todos os pratos
router.get('/', async (_req, res) => {
  try {
    const plates = await AppDataSource.getRepository(Plate).find();
    res.json(plates);
  } catch (error) {
    handleError(res, error, 'Falha ao listar pratos');
  }
});

// Buscar um prato por ID
router.get<{ id: string }>('/:id', async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const plate = await AppDataSource.getRepository(Plate).findOne({ where: { id } });
    if (!plate) {
      res.status(404).json({ message: 'Prato não encontrado' });
      return;
    }

    res.json(plate);
  } catch (error) {
    handleError(res, error, 'Falha ao buscar prato');
  }
});

// Atualizar um prato
router.patch<{ id: string }, {}, UpdatePlateDto>('/:id', validateRequest(UpdatePlateDto), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const plate = await AppDataSource.getRepository(Plate).findOne({ where: { id } });
    if (!plate) {
      res.status(404).json({ message: 'Prato não encontrado' });
      return;
    }

    const { name, description, price, info, type } = req.validatedBody as UpdatePlateDto;

    if (name !== undefined) plate.name = name;
    if (description !== undefined) plate.description = description;
    if (price !== undefined) plate.price = price;
    if (info !== undefined) plate.info = info;
    if (type !== undefined) plate.type = type;

    const updatedPlate = await AppDataSource.getRepository(Plate).save(plate);
    res.json(updatedPlate);
  } catch (error) {
    handleError(res, error, 'Falha ao atualizar prato');
  }
});

// Deletar um prato
router.delete<{ id: string }>('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const plate = await AppDataSource.getRepository(Plate).findOne({ where: { id } });
    if (!plate) {
      res.status(404).json({ message: 'Prato não encontrado' });
      return;
    }

    await AppDataSource.getRepository(Plate).remove(plate);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Falha ao deletar prato');
  }
});

export default router;
