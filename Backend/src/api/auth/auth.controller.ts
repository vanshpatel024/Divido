import { Request, Response, NextFunction } from 'express';
import { AuthService, authSchema, profileUpdateSchema } from './auth.service';
import { createResponse } from '../../utils/response';
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

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json(createResponse(false, 'Refresh token is required'));
        return;
      }
      const data = await AuthService.refreshSession(refreshToken);
      res.status(200).json(createResponse(true, 'Session refreshed successfully', data));
    } catch (error) {
      res.status(401).json(createResponse(false, 'Invalid or expired refresh token'));
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

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body || {};
      if (!email) {
        res.status(400).json(createResponse(false, 'Email is required'));
        return;
      }

      // Check if email exists
      const exists = await AuthService.checkEmailExists(email);
      if (!exists) {
        res.status(404).json(createResponse(false, 'Email address not found'));
        return;
      }

      const origin = req.headers.origin || 'http://localhost:5173';
      const redirectTo = `${origin}/reset-password`;

      await AuthService.requestPasswordReset(email, redirectTo);
      res.status(200).json(createResponse(true, 'Password reset email sent successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }

      const { password } = req.body;
      if (!password || password.length < 6) {
        res.status(400).json(createResponse(false, 'Password must be at least 6 characters long'));
        return;
      }

      await AuthService.updatePassword(req.user.id, password);
      res.status(200).json(createResponse(true, 'Password updated successfully'));
    } catch (error) {
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
