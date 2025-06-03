import { Router, Response } from 'express';
import platesRouter from './plates.routes';
import beveragesRouter from './beverages.routes';
import dessertsRouter from './desserts.routes';
import ordersRouter from './orders.routes';

const router = Router();

// Função auxiliar para lidar com erros
export const handleError = (res: Response, error: unknown, message: string): Response => {
  console.error(message, error);
  if (error instanceof Error) {
    return res.status(500).json({ message: `${message}: ${error.message}` });
  } else {
    return res.status(500).json({ message: `${message}: Erro desconhecido` });
  }
};

// Configuração das rotas
router.use('/plates', platesRouter);
router.use('/beverages', beveragesRouter);
router.use('/desserts', dessertsRouter);
router.use('/orders', ordersRouter);

export default router;
