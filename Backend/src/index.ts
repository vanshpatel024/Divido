import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './api/auth/auth.routes';
import tripRoutes from './api/trips/trip.routes';
import userRoutes from './api/users/user.routes';
import { errorHandler } from './middlewares/error.middleware';
import { createResponse } from './utils/response';
import { initWsServer } from './ws/wsServer';

const app = express();

// Security Middlewares
app.use(helmet());

// CORS configuration - permissive for local dev as requested
app.use(cors({ origin: '*' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json(createResponse(true, 'Server is running healthily'));
});

// Routes
app.use('/auth', authRoutes);
app.use('/trips', tripRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json(createResponse(false, 'Route not found'));
});

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 3000;

// Create HTTP server and attach WebSocket server to share the same port
const httpServer = http.createServer(app);
initWsServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Reload trigger

