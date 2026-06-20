import { Router } from 'express';
import { TripController } from '../controllers/trip.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All trip routes must be authenticated
router.use(authMiddleware);

router.get('/', TripController.getUserTrips);
router.post('/', TripController.createTrip);

export default router;
