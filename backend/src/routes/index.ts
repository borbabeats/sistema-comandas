import { Router, Request as ExpressRequest, Response, NextFunction, RequestHandler } from 'express';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any; // You might want to replace 'any' with a more specific type
    }
  }
}

// Re-export the extended Request type for convenience
type Request = ExpressRequest;
import { AppDataSource } from '../config/database';
import { Plate, FoodType } from '../entities/Plate';
import { Dessert } from '../entities/Dessert';
import { Beverage, BeverageType } from '../entities/Beverage';
import { validate, IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, IsPositive } from 'class-validator';
import { plainToInstance } from 'class-transformer';

const router = Router();

// Função auxiliar para lidar com erros
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Error) {
    return res.status(500).json({ message: `${message}: ${error.message}` });
  }
  return res.status(500).json({ message: `${message}: Erro desconhecido` });
};

// Middleware para validação de DTOs
const validateRequest = <T extends object>(dtoClass: new () => T): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      // Ensure the request body is an object
      if (!req.body || typeof req.body !== 'object') {
        console.error('Invalid request body:', req.body);
        res.status(400).json({ errors: ['Request body must be a valid JSON object'] });
        return;
      }

      // Log the incoming request body
      console.log('Raw request body:', JSON.stringify(req.body));
      
      // Transform the plain object to instance of the DTO class
      const dto = plainToInstance(dtoClass, req.body, { 
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
        exposeDefaultValues: true
      });
      
      console.log('DTO after transformation:', JSON.stringify(dto, null, 2));
      
      try {
        // Validate the DTO
        const errors = await validate(dto as object, { 
          whitelist: true,
          forbidNonWhitelisted: false,
          validationError: { target: false },
          forbidUnknownValues: false
        });
        
        console.log('Validation errors:', errors);
        
        if (errors.length > 0) {
          const errorMessages = errors.flatMap(error => {
            if (error.constraints) {
              return Object.values(error.constraints);
            } else if (error.children && error.children.length > 0) {
              return error.children.flatMap(childError => 
                childError.constraints ? Object.values(childError.constraints) : []
              );
            }
            return ['An unknown validation error occurred'];
          });
          
          console.error('Validation failed with errors:', errorMessages);
          res.status(400).json({ errors: errorMessages });
          return;
        }
        
        // Add the validated DTO to the request object
        req.validatedBody = dto;
        req.body = dto;
        next();
      } catch (validationError) {
        console.error('Validation error:', validationError);
        res.status(400).json({ 
          errors: ['Validation failed'],
          details: validationError instanceof Error ? validationError.message : 'Unknown validation error'
        });
      }
    } catch (error) {
      console.error('Unexpected error during validation:', error);
      res.status(500).json({ 
        errors: ['An unexpected error occurred during validation'],
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

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

// Rotas para pratos
router.post<{}, {}, CreatePlateDto>('/plates', validateRequest(CreatePlateDto), async (req, res) => {
  try {
    const { name, description, price, info, type } = req.body;
    
    const plate = new Plate();
    plate.name = name;
    plate.description = description;
    plate.price = price;
    plate.info = info;
    plate.type = type;
    
    const savedPlate = await AppDataSource.getRepository(Plate).save(plate);
    res.status(201).json(savedPlate);
  } catch (error) {
    handleError(res, error, 'Failed to create plate');
  }
});

router.get('/plates', async (_req, res, next) => {
  try {
    const plates = await AppDataSource.getRepository(Plate).find();
    res.json(plates);
  } catch (error) {
    next(error);
  }
});

// Rota para buscar um único prato por ID
router.get<{ id: string }>('/plates/:id', async (req, res, next) => {
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
    next(error);
  }
});

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

// Rotas para sobremesas
router.post<{}, {}, CreateDessertDto>('/desserts', validateRequest(CreateDessertDto), async (req, res, next) => {
  try {
    const { name, description, price, info } = req.body;
    
    const dessert = new Dessert();
    dessert.name = name;
    dessert.description = description;
    dessert.price = price;
    if (info) dessert.info = info;
    
    const savedDessert = await AppDataSource.getRepository(Dessert).save(dessert);
    res.status(201).json(savedDessert);
  } catch (error) {
    next(error);
  }
});

router.get('/desserts', async (_req, res, next) => {
  try {
    const desserts = await AppDataSource.getRepository(Dessert).find();
    res.json(desserts);
  } catch (error) {
    next(error);
  }
});

router.get<{ id: string }>('/desserts/:id', async (req, res, next) => {
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
    next(error);
  }
});

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

// Rotas para bebidas
router.post<{}, {}, CreateBeverageDto>('/beverages', validateRequest(CreateBeverageDto), async (req, res, next) => {
  try {
    const { name, description, price, type, info } = req.body;
    
    const beverage = new Beverage();
    beverage.name = name;
    beverage.description = description;
    beverage.price = price;
    beverage.type = type;
    if (info) beverage.info = info;
    
    const savedBeverage = await AppDataSource.getRepository(Beverage).save(beverage);
    res.status(201).json(savedBeverage);
  } catch (error) {
    next(error);
  }
});

router.get('/beverages', async (_req, res, next) => {
  try {
    const beverages = await AppDataSource.getRepository(Beverage).find();
    res.json(beverages);
  } catch (error) {
    next(error);
  }
});

router.get<{ id: string }>('/beverages/:id', async (req, res, next) => {
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
    next(error);
  }
});

export default router;