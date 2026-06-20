"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Apply rate limiter to all auth routes
router.use(rateLimiter_1.authRateLimiter);
router.post('/signup', auth_controller_1.AuthController.signup);
router.post('/login', auth_controller_1.AuthController.login);
router.post('/logout', auth_controller_1.AuthController.logout);
// Protected route
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map