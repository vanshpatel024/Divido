import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All user routes must be authenticated
router.use(authMiddleware);

router.get('/search', UserController.search);
router.get('/me/activities', UserController.getActivities);

export default router;
