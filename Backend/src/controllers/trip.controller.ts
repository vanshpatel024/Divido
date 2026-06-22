import { Request, Response, NextFunction } from 'express';
import { TripService, tripCreateSchema, stopCreateSchema, tripInviteSchema } from '../services/trip.service';
import { createResponse } from '../utils/response';
import { ZodError } from 'zod';
import { wsManager } from '../ws/wsManager';

export class TripController {
  static async getUserTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      
      const trips = await TripService.getUserTrips(req.user.id);
      
      res.status(200).json(createResponse(true, 'Trips retrieved successfully', trips));
    } catch (error) {
      next(error);
    }
  }

  static async getSingleTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      
      const trip = await TripService.getSingleTrip(req.params.id as string, req.user.id);
      res.status(200).json(createResponse(true, 'Trip retrieved successfully', trip));
    } catch (error) {
      next(error);
    }
  }

  static async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }

      const parsedData = tripCreateSchema.parse(req.body);
      const newTrip = await TripService.createTrip(req.user.id, parsedData);

      // Notify each invitee's dashboard in real-time so invitations appear without a refresh
      if (parsedData.invitees.length > 0) {
        wsManager.broadcastToDashboards(parsedData.invitees, 'invitation_received', { tripId: newTrip.id });
      }

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
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const tripId = req.params.id as string;
      const trip = await TripService.endTrip(tripId, req.user.id);

      // Broadcast to all clients in the trip room
      wsManager.broadcast(tripId, 'trip_ended', {});
      // Also push to each participant's dashboard room
      const participantIds = (trip.participants || []).map((p: any) => p.id).filter(Boolean);
      wsManager.broadcastToDashboards(participantIds, 'trip_ended', { tripId });

      res.status(200).json(createResponse(true, 'Trip ended successfully', trip));
    } catch (error) {
      next(error);
    }
  }

  static async deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const result = await TripService.deleteTrip(req.params.id as string, req.user.id);

      // Broadcast real-time leaving notifications to the remaining participants
      if (result.participantIds && result.participantIds.length > 0) {
        const tripId = req.params.id as string;
        wsManager.broadcast(tripId, 'participant_left', {
          tripId,
          tripName: result.tripName,
          userName: result.userDisplayName
        });
        wsManager.broadcastToDashboards(result.participantIds, 'participant_left', {
          tripId,
          tripName: result.tripName,
          userName: result.userDisplayName
        });
      }

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
      if (!req.user) {
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
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const parsedData = stopCreateSchema.parse(req.body);
      const tripId = req.params.id as string;
      const newStop = await TripService.createStop(tripId, req.user.id, parsedData);

      // Broadcast to all clients viewing this trip
      wsManager.broadcast(tripId, 'stop_created', { stopId: newStop.id });
      // Also push to each participant's dashboard room so their totals refresh
      const participantIds = await TripService.getTripParticipantIds(tripId);
      wsManager.broadcastToDashboards(participantIds, 'stop_created', { tripId });

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
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const invites = await TripService.getPendingInvitations(req.user.id);
      res.status(200).json(createResponse(true, 'Invitations retrieved', invites));
    } catch (error) {
      next(error);
    }
  }

  static async respondToInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const { accept } = req.body;
      if (typeof accept !== 'boolean') {
        res.status(400).json(createResponse(false, 'Validation error', undefined, [{ message: 'accept must be a boolean' }]));
        return;
      }
      const result = await TripService.respondToInvitation(req.params.id as string, req.user.id, accept);

      const { tripId, senderId, status } = result as any;

      if (tripId && senderId) {
        // Broadcast invitation response to the sender's dashboard so their activities list updates in real-time
        wsManager.broadcastToDashboards([senderId], 'invitation_response', { tripId, status });
        
        // Broadcast that invitations changed to the trip details room
        wsManager.broadcast(tripId, 'invitations_changed', { tripId });

        if (accept && !result.alreadyParticipant) {
          // Broadcast to anyone currently viewing the trip detail page
          wsManager.broadcast(tripId, 'participant_joined', {
            userName: result.userDisplayName
          });
          
          // Also broadcast to all existing participants' dashboard rooms
          const participantIds = await TripService.getTripParticipantIds(tripId);
          wsManager.broadcastToDashboards(participantIds, 'participant_joined', { tripId });
        }
      }

      res.status(200).json(createResponse(true, 'Invitation response saved'));
    } catch (error) {
      next(error);
    }
  }

  static async getTripInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }
      const tripId = req.params.id as string;
      const invitations = await TripService.getTripPendingInvitations(tripId);
      res.status(200).json(createResponse(true, 'Trip invitations retrieved', invitations));
    } catch (error) {
      next(error);
    }
  }

  static async inviteParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createResponse(false, 'Unauthorized'));
        return;
      }

      const tripId = req.params.id as string;
      const parsedData = tripInviteSchema.parse(req.body);

      const result = await TripService.inviteParticipants(tripId, req.user.id, parsedData.invitees);

      // Notify each newly invited user's dashboard in real-time so invitations appear without a refresh
      if (result.invitees && result.invitees.length > 0) {
        wsManager.broadcastToDashboards(result.invitees, 'invitation_received', { tripId });
      }

      // Broadcast invitations_changed to the trip details room
      wsManager.broadcast(tripId, 'invitations_changed', { tripId });

      res.status(200).json(createResponse(true, 'Participants invited successfully', result));
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, 'Validation error', undefined, (error as any).errors));
        return;
      }
      if (error instanceof Error) {
        res.status(400).json(createResponse(false, error.message));
        return;
      }
      next(error);
    }
  }
}
