import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

// Apply rate limiter to all auth routes
router.use(authRateLimiter);

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', authMiddleware, AuthController.me);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.put('/update-password', authMiddleware, AuthController.updatePassword);
router.delete('/delete-account', authMiddleware, AuthController.deleteAccount);

export default router;
