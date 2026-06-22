import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { createResponse } from '../utils/response';

export class UserController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string || '';
      const tripId = req.query.tripId as string || undefined;
      const users = await UserService.searchUsers(q, tripId);
      res.status(200).json(createResponse(true, 'Users found', users));
    } catch (error) {
      next(error);
    }
  }

  static async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const activities = await UserService.getActivities(req.user.id);
      res.status(200).json(createResponse(true, 'Activities retrieved', activities));
    } catch (error) {
      next(error);
    }
  }
}
