import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Beverage, BeverageType } from '../entities/Beverage';
import { validate, IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, IsPositive } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { handleError } from './index';
import { ParamsDictionary } from 'express-serve-static-core';

const router = Router();

// DTO para criação de bebidas
class CreateBeverageDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be a positive number' })
  price!: number;

  @IsEnum(BeverageType, { message: 'Invalid beverage type' })
  @IsNotEmpty({ message: 'Type is required' })
  type!: BeverageType;

  @IsString()
  @IsOptional()
  info?: string;
}

// DTO para atualização de bebidas
class UpdateBeverageDto {
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

  @IsEnum(BeverageType, { message: 'Invalid beverage type' })
  @IsOptional()
  type?: BeverageType;

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

// Criar uma nova bebida
router.post<{}, {}, CreateBeverageDto>('/', validateRequest(CreateBeverageDto), async (req: Request, res: Response) => {
  try {
    const validatedBody = (req as any).validatedBody as CreateBeverageDto;
    if (!validatedBody) {
      res.status(400).json({ message: 'Dados inválidos' });
      return;
    }
    const { name, description, price, type, info } = validatedBody;
    
    const beverage = new Beverage();
    beverage.name = name;
    beverage.description = description;
    beverage.price = price;
    beverage.type = type;
    if (info) beverage.info = info;
    
    const savedBeverage = await AppDataSource.getRepository(Beverage).save(beverage);
    res.status(201).json(savedBeverage);
  } catch (error) {
    handleError(res, error, 'Falha ao criar bebida');
  }
});

// Listar todas as bebidas
router.get('/', async (_req, res) => {
  try {
    const beverages = await AppDataSource.getRepository(Beverage).find();
    res.json(beverages);
  } catch (error) {
    handleError(res, error, 'Falha ao listar bebidas');
  }
});

// Buscar uma bebida por ID
router.get<ParamsDictionary, any, any>('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const beverage = await AppDataSource.getRepository(Beverage).findOne({ where: { id } });
    if (!beverage) {
      res.status(404).json({ message: 'Bebida não encontrada' });
      return;
    }

    res.json(beverage);
  } catch (error) {
    handleError(res, error as Error, 'Falha ao buscar bebida');
  }
});

// Atualizar uma bebida
router.patch<{ id: string }, {}, UpdateBeverageDto>('/:id', validateRequest(UpdateBeverageDto), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const beverage = await AppDataSource.getRepository(Beverage).findOne({ where: { id } });
    if (!beverage) {
      res.status(404).json({ message: 'Bebida não encontrada' });
      return;
    }

    const validatedBody = (req as any).validatedBody as UpdateBeverageDto;
    if (!validatedBody) {
      res.status(400).json({ message: 'Dados inválidos' });
      return;
    }
    const { name, description, price, type, info } = validatedBody;

    if (name !== undefined) beverage.name = name;
    if (description !== undefined) beverage.description = description;
    if (price !== undefined) beverage.price = price;
    if (type !== undefined) beverage.type = type;
    if (info !== undefined) beverage.info = info;

    const updatedBeverage = await AppDataSource.getRepository(Beverage).save(beverage);
    res.json(updatedBeverage);
  } catch (error) {
    handleError(res, error, 'Falha ao deletar bebida');
  }
});

// Deletar uma bebida
router.delete<{ id: string }>('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const beverage = await AppDataSource.getRepository(Beverage).findOne({ where: { id } });
    if (!beverage) {
      res.status(404).json({ message: 'Bebida não encontrada' });
      return;
    }

    await AppDataSource.getRepository(Beverage).remove(beverage);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Falha ao deletar bebida');
  }
});

export default router;
