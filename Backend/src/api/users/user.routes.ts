import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// All user routes must be authenticated
router.use(authMiddleware);

router.get('/search', UserController.search);
router.get('/me/activities', UserController.getActivities);
router.delete('/me/activities', UserController.clearActivities);

export default router;
