import { Request, Response, NextFunction } from 'express';
import { AuthService, authSchema } from '../services/auth.service';
import { createResponse } from '../utils/response';
import { ZodError } from 'zod';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedData = authSchema.parse(req.body);
      const data = await AuthService.signup(parsedData);
      
      res.status(201).json(createResponse(true, 'User signed up successfully', data));
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, 'Validation error', undefined, (error as any).errors));
        return;
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedData = authSchema.parse(req.body);
      const data = await AuthService.login(parsedData);
      
      res.status(200).json(createResponse(true, 'User logged in successfully', data));
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, 'Validation error', undefined, (error as any).errors));
        return;
      }
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a pure JWT stateless setup with Supabase, client simply drops the token.
      // We can also tell Supabase to signout if we had session management.
      // For now, we just acknowledge.
      res.status(200).json(createResponse(true, 'User logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is attached by authMiddleware
      res.status(200).json(createResponse(true, 'User profile retrieved', req.user));
    } catch (error) {
      next(error);
    }
  }
}
