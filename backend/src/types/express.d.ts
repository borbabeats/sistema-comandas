import { User } from '../entities/User';

// Extend the Express namespace to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: User;
      validatedBody?: any;
    }
  }
}

// This is needed to make this file a module
export {};
