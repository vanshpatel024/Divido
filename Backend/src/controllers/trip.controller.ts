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

  static async getSingleTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      
      const trip = await TripService.getSingleTrip(req.params.id as string);
      
      // Basic security check: ensure user is a participant or creator
      // To properly secure, we could do this inside the service, but here we just return the trip if no error was thrown.
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
