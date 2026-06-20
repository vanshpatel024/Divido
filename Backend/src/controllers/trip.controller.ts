import { Request, Response, NextFunction } from 'express';
import { TripService, tripCreateSchema } from '../services/trip.service';
import { createResponse } from '../utils/response';
import { ZodError } from 'zod';

export class TripController {
  static async getUserTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      
      const trips = await TripService.getUserTrips((req as any).user.id);
      
      res.status(200).json(createResponse(true, 'Trips retrieved successfully', trips));
    } catch (error) {
      next(error);
    }
  }

  static async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }

      const parsedData = tripCreateSchema.parse(req.body);
      const newTrip = await TripService.createTrip((req as any).user.id, parsedData);

      res.status(201).json(createResponse(true, 'Trip created successfully', newTrip));
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, 'Validation error', undefined, (error as any).errors));
        return;
      }
      next(error);
    }
  }
}
