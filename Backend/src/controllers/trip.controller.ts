import { Request, Response, NextFunction } from 'express';
import { TripService, tripCreateSchema, stopCreateSchema } from '../services/trip.service';
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

  static async getSingleTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      
      const trip = await TripService.getSingleTrip(req.params.id as string, (req as any).user.id);
      res.status(200).json(createResponse(true, 'Trip retrieved successfully', trip));
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

  static async endTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const trip = await TripService.endTrip(req.params.id as string, (req as any).user.id);
      res.status(200).json(createResponse(true, 'Trip ended successfully', trip));
    } catch (error) {
      next(error);
    }
  }

  static async deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      await TripService.deleteTrip(req.params.id as string, (req as any).user.id);
      res.status(200).json(createResponse(true, 'Trip deleted/left successfully'));
    } catch (error: any) {
      if (error.message && (error.message.includes('not ended') || error.message.includes('settled'))) {
        res.status(400).json(createResponse(false, error.message));
        return;
      }
      if (error.message && error.message.includes('not found')) {
        res.status(404).json(createResponse(false, error.message));
        return;
      }
      next(error);
    }
  }

  static async getStops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const stops = await TripService.getStops(req.params.id as string);
      res.status(200).json(createResponse(true, 'Stops retrieved', stops));
    } catch (error) {
      next(error);
    }
  }

  static async createStop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const parsedData = stopCreateSchema.parse(req.body);
      const newStop = await TripService.createStop(req.params.id as string, (req as any).user.id, parsedData);
      res.status(201).json(createResponse(true, 'Stop created', newStop));
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, 'Validation error', undefined, (error as any).errors));
        return;
      }
      next(error);
    }
  }

  static async getPendingInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const invites = await TripService.getPendingInvitations((req as any).user.id);
      res.status(200).json(createResponse(true, 'Invitations retrieved', invites));
    } catch (error) {
      next(error);
    }
  }

  static async respondToInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const { accept } = req.body;
      if (typeof accept !== 'boolean') {
        res.status(400).json(createResponse(false, 'Validation error', undefined, [{ message: 'accept must be a boolean' }]));
        return;
      }
      await TripService.respondToInvitation(req.params.id as string, (req as any).user.id, accept);
      res.status(200).json(createResponse(true, 'Invitation response saved'));
    } catch (error) {
      next(error);
    }
  }
}
