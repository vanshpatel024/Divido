import { Router } from 'express';
import { TripController } from '../controllers/trip.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All trip routes must be authenticated
router.use(authMiddleware);

router.get('/invitations', TripController.getPendingInvitations);
router.post('/invitations/:id/respond', TripController.respondToInvitation);

router.get('/', TripController.getUserTrips);
router.get('/:id', TripController.getSingleTrip);
router.post('/', TripController.createTrip);
router.put('/:id/end', TripController.endTrip);
router.delete('/:id', TripController.deleteTrip);

router.get('/:id/stops', TripController.getStops);
router.post('/:id/stops', TripController.createStop);

export default router;
