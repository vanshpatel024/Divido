import { Request, Response, NextFunction } from 'express';
import { supabaseAnon } from '../config/supabase';
import { createResponse } from '../utils/response';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(createResponse(false, 'Missing or invalid authorization header'));
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json(createResponse(false, 'Token missing from authorization header'));
      return;
    }

    // Verify token with Supabase
    // Using supabaseAnon.auth.getUser(token) is the secure way to validate a JWT
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase auth error:', error?.message);
      res.status(401).json(createResponse(false, 'Invalid or expired token', undefined, error?.message));
      return;
    }

    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    next(error);
  }
};
