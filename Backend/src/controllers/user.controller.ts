import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { createResponse } from '../utils/response';

export class UserController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string || '';
      const users = await UserService.searchUsers(q);
      res.status(200).json(createResponse(true, 'Users found', users));
    } catch (error) {
      next(error);
    }
  }
}
