import { Router, Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { Plate } from '../entities/Plate';
import { Beverage } from '../entities/Beverage';
import { Dessert } from '../entities/Dessert';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { handleError } from '../middleware/error-handler';

// Type for async request handlers
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response | void>;


const router = Router();

// Middleware para validação de DTOs
const validateRequest = <T extends object>(dtoClass: new () => T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert and validate request body against DTO
      const dto = plainToInstance(dtoClass, req.body);
      const errors = await validate(dto as object);
      
      // Handle validation errors
      if (errors.length > 0) {
        const errorMessages = errors.flatMap(error => 
          error.constraints ? Object.values(error.constraints) : []
        );
        res.status(400).json({ errors: errorMessages });
        return;
      }

      // Check if at least one item is present for order-related DTOs
      if (dto instanceof CreateOrderDto || dto instanceof UpdateOrderDto) {
        const hasItem = (dto as any).plateId !== undefined || 
                       (dto as any).beverageId !== undefined || 
                       (dto as any).dessertId !== undefined;
        
        if (!hasItem) {
          res.status(400).json({ 
            message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' 
          });
          return;
        }
      }
      
      // Attach validated DTO to request and proceed
      req.body = dto;
      (req as any).validatedBody = dto;
      next();
    } catch (error) {
      handleError(res, error, 'Falha na validação dos dados');
    }
  };
};

// Create a new order
const createOrder: AsyncRequestHandler = async (req, res) => {
  const { clientName, plateId, beverageId, dessertId, isPaid } = (req as any).validatedBody as CreateOrderDto;

  try {
    const order = new Order();
    order.clientName = clientName;
    order.isPaid = isPaid || false;

    if (plateId) {
      const plate = await AppDataSource.getRepository(Plate).findOne({ where: { id: plateId } });
      if (!plate) {
        return res.status(404).json({ message: 'Prato não encontrado' });
      }
      order.plate = plate;
    }

    if (beverageId) {
      const beverage = await AppDataSource.getRepository(Beverage).findOne({ where: { id: beverageId } });
      if (!beverage) {
        return res.status(404).json({ message: 'Bebida não encontrada' });
      }
      order.beverage = beverage;
    }

    if (dessertId) {
      const dessert = await AppDataSource.getRepository(Dessert).findOne({ where: { id: dessertId } });
      if (!dessert) {
        return res.status(404).json({ message: 'Sobremesa não encontrada' });
      }
      order.dessert = dessert;
    }

    const savedOrder = await AppDataSource.getRepository(Order).save(order);
    
    const orderWithRelations = await AppDataSource.getRepository(Order).findOne({
      where: { id: savedOrder.id },
      relations: ['plate', 'beverage', 'dessert']
    });

    if (!orderWithRelations) {
      throw new Error('Falha ao carregar os detalhes do pedido após a criação');
    }

    return res.status(201).json(orderWithRelations);
  } catch (error) {
    handleError(res, error, 'Falha ao criar pedido');
    throw error; // This will be caught by the route handler's catch
  }
};

// List all orders
const listOrders: AsyncRequestHandler = async (_, res, next) => {
  try {
    const orders = await AppDataSource.getRepository(Order).find({
      relations: ['plate', 'beverage', 'dessert'],
      order: { createdAt: 'DESC' }
    });
    res.json(orders);
    next();
  } catch (error) {
    next(error);
  }
};

// Get order by ID
const getOrderById: AsyncRequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return next();
    }

    const order = await AppDataSource.getRepository(Order).findOne({
      where: { id },
      relations: ['plate', 'beverage', 'dessert']
    });

    if (!order) {
      res.status(404).json({ message: 'Pedido não encontrado' });
      return next();
    }

    res.json(order);
    next();
  } catch (error) {
    next(error);
  }
};

// Register routes
router.post(
  '/',
  validateRequest(CreateOrderDto),
  (req: Request, res: Response, next: NextFunction) => {
    createOrder(req, res, next).catch(next);
  }
);

router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    listOrders(req, res, next).catch(next);
  }
);

router.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    getOrderById(req, res, next).catch(next);
  }
);

// Update an order
const updateOrder: AsyncRequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const order = await AppDataSource.getRepository(Order).findOne({
      where: { id },
      relations: ['plate', 'beverage', 'dessert']
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const { clientName, plateId, beverageId, dessertId, isPaid } = (req as any).validatedBody as UpdateOrderDto;

    if (clientName !== undefined) {
      order.clientName = clientName;
    }

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
    }

    // Atualiza os relacionamentos se fornecidos
    if (plateId !== undefined) {
      if (plateId === null) {
        order.plate = null;
      } else {
        const plate = await AppDataSource.getRepository(Plate).findOne({ where: { id: plateId } });
        if (!plate) {
          return res.status(404).json({ message: 'Prato não encontrado' });
        }
        order.plate = plate;
      }
    }

    if (beverageId !== undefined) {
      if (beverageId === null) {
        order.beverage = null;
      } else {
        const beverage = await AppDataSource.getRepository(Beverage).findOne({ where: { id: beverageId } });
        if (!beverage) {
          return res.status(404).json({ message: 'Bebida não encontrada' });
        }
        order.beverage = beverage;
      }
    }

    if (dessertId !== undefined) {
      if (dessertId === null) {
        order.dessert = null;
      } else {
        const dessert = await AppDataSource.getRepository(Dessert).findOne({ where: { id: dessertId } });
        if (!dessert) {
          return res.status(404).json({ message: 'Sobremesa não encontrada' });
        }
        order.dessert = dessert;
      }
    }

    // Verifica se pelo menos um item está presente após a atualização
    if (!order.plate && !order.beverage && !order.dessert) {
      return res.status(400).json({ 
        message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser mantido' 
      });
    }

    order.updatedAt = new Date();
    const updatedOrder = await AppDataSource.getRepository(Order).save(order);
    
    // Recarregar com relacionamentos atualizados
    const orderWithRelations = await AppDataSource.getRepository(Order).findOne({
      where: { id: updatedOrder.id },
      relations: ['plate', 'beverage', 'dessert']
    });

    return res.json(orderWithRelations);
  } catch (error) {
    return handleError(res, error, 'Falha ao atualizar pedido');
  }
};

router.patch<{ id: string }>(
  '/:id',
  validateRequest(UpdateOrderDto),
  (req: Request, res: Response, next: NextFunction) => {
    updateOrder(req, res, next).catch(next);
  }
);

// Delete an order
const deleteOrder: AsyncRequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const order = await AppDataSource.getRepository(Order).findOne({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    await AppDataSource.getRepository(Order).remove([order]);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error, 'Falha ao deletar pedido');
  }
};

router.delete<{ id: string }>(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteOrder(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
