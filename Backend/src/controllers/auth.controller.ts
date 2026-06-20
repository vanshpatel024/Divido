import { Request, Response, NextFunction } from 'express';
import { AuthService, authSchema, profileUpdateSchema } from '../services/auth.service';
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
      const loginSchema = authSchema.pick({ email: true, password: true });
      const parsedData = loginSchema.parse(req.body);
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
      res.status(200).json(createResponse(true, 'User logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      
      // Get detailed profile from database
      const profile = await AuthService.getProfile(req.user.id);
      
      res.status(200).json(createResponse(true, 'User profile retrieved', {
        auth: req.user,
        profile
      }));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }

      const parsedData = profileUpdateSchema.parse(req.body);
      const updatedProfile = await AuthService.updateProfile(req.user.id, parsedData);

      res.status(200).json(createResponse(true, 'Profile updated successfully', updatedProfile));
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, 'Validation error', undefined, (error as any).errors));
        return;
      }
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }

      await AuthService.deleteAccount(req.user.id);
      res.status(200).json(createResponse(true, 'Account deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
