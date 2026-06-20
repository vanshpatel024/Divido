import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import tripRoutes from './routes/trip.routes';
import { errorHandler } from './middleware/error.middleware';
import { createResponse } from './utils/response';

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

// 404 handler
app.use((req, res, next) => {
  res.status(404).json(createResponse(false, 'Route not found'));
});

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
