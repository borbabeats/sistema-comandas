import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      validatedBody?: any; // This will be properly typed by the validateRequest middleware
    }
  }
}
