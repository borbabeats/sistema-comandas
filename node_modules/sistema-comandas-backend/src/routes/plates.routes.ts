import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Plate } from '../entities/Plate';
import { validate, IsString, IsNumber, IsOptional, IsArray, IsNotEmpty, IsPositive } from 'class-validator';
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  type?: string[];
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  type?: string[];
}

// Middleware para validação de DTOs
const validateRequest = <T extends object>(dtoClass: new () => T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = plainToInstance(dtoClass, req.body);
      const errors = await validate(dto as object);
      
      if (errors.length > 0) {
        const errorMessages = errors.flatMap(error => 
          error.constraints ? Object.values(error.constraints) : []
        );
        res.status(400).json({ errors: errorMessages });
        return;
      }

      // Define explicitamente o tipo do validatedBody
      (req as any).validatedBody = dto;
      next();
    } catch (error) {
      handleError(res, error, 'Falha na validação dos dados');
    }
  };
};

// Criar um novo prato
router.post('/', validateRequest(CreatePlateDto), async (req: Request, res: Response) => {
  try {
    const validatedBody = (req as any).validatedBody as CreatePlateDto;
    
    const plate = new Plate();
    plate.name = validatedBody.name;
    plate.description = validatedBody.description;
    plate.price = validatedBody.price;
    if (validatedBody.info) plate.info = validatedBody.info;
    plate.type = validatedBody.type;
    
    const savedPlate = await AppDataSource.getRepository(Plate).save(plate);
    res.status(201).json(savedPlate);
  } catch (error) {
    handleError(res, error, 'Falha ao criar prato');
  }
});

// Listar todos os pratos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const plates = await AppDataSource.getRepository(Plate).find();
    res.json(plates);
  } catch (error) {
    handleError(res, error, 'Falha ao listar pratos');
  }
});

// Buscar um prato por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'];
    
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

// Atualizar um prato existente
router.put('/:id', validateRequest(UpdatePlateDto), async (req: Request, res: Response) => {
  try {
    const id = req.params['id'];

    const plate = await AppDataSource.getRepository(Plate).findOne({ where: { id } });
    if (!plate) {
      res.status(404).json({ message: 'Prato não encontrado' });
      return;
    }

    const validatedBody = (req as any).validatedBody as UpdatePlateDto;

    if (validatedBody.name !== undefined) plate.name = validatedBody.name;
    if (validatedBody.description !== undefined) plate.description = validatedBody.description;
    if (validatedBody.price !== undefined) plate.price = validatedBody.price;
    if (validatedBody.info !== undefined) plate.info = validatedBody.info;
    if (validatedBody.type !== undefined) plate.type = validatedBody.type;

    const updatedPlate = await AppDataSource.getRepository(Plate).save(plate);
    res.json(updatedPlate);
  } catch (error) {
    handleError(res, error, 'Falha ao atualizar prato');
  }
});

// Deletar um prato
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'];

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
