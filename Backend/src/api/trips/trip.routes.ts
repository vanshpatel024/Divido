import { Router } from 'express';
import { TripController } from './trip.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tripMemberMiddleware } from './tripMember.middleware';

const router = Router();

// All trip routes must be authenticated
router.use(authMiddleware);

// Invitation routes — no trip membership required (user doesn't belong to trip yet)
router.get('/invitations', TripController.getPendingInvitations);
router.post('/invitations/:id/respond', TripController.respondToInvitation);

// Trip collection routes — no membership check (getUserTrips filters by user)
router.get('/', TripController.getUserTrips);
router.post('/', TripController.createTrip);

// Per-trip routes — require membership (tripMemberMiddleware checks trip_participants)
router.get('/:id', tripMemberMiddleware, TripController.getSingleTrip);
router.put('/:id/end', tripMemberMiddleware, TripController.endTrip);
router.delete('/:id', tripMemberMiddleware, TripController.deleteTrip);

router.get('/:id/stops', tripMemberMiddleware, TripController.getStops);
router.post('/:id/stops', tripMemberMiddleware, TripController.createStop);
router.put('/:id/stops/:stopId', tripMemberMiddleware, TripController.updateStop);
router.delete('/:id/stops/:stopId', tripMemberMiddleware, TripController.deleteStop);
router.post('/:id/invite', tripMemberMiddleware, TripController.inviteParticipants);
router.get('/:id/invitations', tripMemberMiddleware, TripController.getTripInvitations);

export default router;
