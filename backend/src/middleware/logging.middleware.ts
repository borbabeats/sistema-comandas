import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger, logStream, logRequest } from '../config/logger';

// Custom Morgan token for response time
morgan.token('response-time', (req: Request) => {
  const startTime = (req as any).startTime || Date.now();
  const duration = Date.now() - startTime;
  return `${duration}ms`;
});

// Custom Morgan format for structured logging
const morganFormat = ':method :url :status :response-time - :user-agent';

// Morgan middleware for HTTP request logging
export const httpLogger = morgan(morganFormat, {
  stream: logStream,
  skip: (req: Request) => {
    // Skip health check and test endpoints in production
    if (process.env.NODE_ENV === 'production') {
      return req.path === '/health' || req.path === '/test-db';
    }
    return false;
  },
});

// Middleware to add start time to request
export const addRequestStartTime = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).startTime = Date.now();
  next();
};

// Custom request logging middleware with more context
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
  });

  // Listen for response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logRequest(
      req.method,
      req.url,
      res.statusCode,
      duration,
      req.get('User-Agent'),
      req.ip || req.connection.remoteAddress
    );
  });

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, _res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    },
  });

  next(error);
};

// Database operation logging middleware
export const databaseLogger = (operation: string, table: string) => {
  return (_target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      logger.debug('Database operation started', {
        operation,
        table,
        method: propertyName,
        args: args.length,
      });

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.info('Database operation completed', {
          operation,
          table,
          method: propertyName,
          duration: `${duration}ms`,
          success: true,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Database operation failed', error as Error, {
          operation,
          table,
          method: propertyName,
          duration: `${duration}ms`,
          success: false,
        });

        throw error;
      }
    };

    return descriptor;
  };
};

// Performance monitoring middleware
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
      });
    }
    
    // Log performance metrics
    logger.debug('Request performance', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryUsage: process.memoryUsage(),
    });
  });

  next();
};

// Security logging middleware
export const securityLogger = (req: Request, _res: Response, next: NextFunction) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempt
    /union.*select/i,  // SQL injection attempt
    /javascript:/i,  // JavaScript protocol
  ];

  const url = req.url;
  const userAgent = req.get('User-Agent') || '';
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      headers: req.headers,
    });
  }

  next();
};

export default {
  httpLogger,
  requestLogger,
  errorLogger,
  databaseLogger,
  performanceLogger,
  securityLogger,
  addRequestStartTime,
};
