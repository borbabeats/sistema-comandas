import { Request, Response, NextFunction } from 'express';

export const handleError = (
  res: Response,
  error: any,
  defaultMessage: string = 'Ocorreu um erro no servidor'
) => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  
  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const asyncHandler = (fn: any) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);
