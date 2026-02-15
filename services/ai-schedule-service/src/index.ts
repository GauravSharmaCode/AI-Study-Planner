import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import studyPlanRoutes from './routes/studyPlanRoutes';
import sessionRoutes from './routes/sessionRoutes';
import { correlationIdMiddleware } from './middleware/correlationId';
import { contextMiddleware } from './middleware/contextMiddleware';
import { requestLogger } from './middleware/requestLogger';
import { createLogger } from './utils/logger';
import config from './config';
import globalErrorHandler from './middleware/errorHandler';
import { startRescheduleWorker, stopRescheduleWorker } from './workers/rescheduleWorker';
import { closeQueue } from './queues/rescheduleQueue';

const logger = createLogger('api-server');

// Initialize Express app
const app = express();
const PORT = config.port;

// Context & Correlation ID (First!)
app.use(contextMiddleware);
app.use(correlationIdMiddleware);

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (After body parser)
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0'
  });
});

// API Routes (unversioned — backward compat)
app.use('/plans', studyPlanRoutes);
app.use('/sessions', sessionRoutes);

// Versioned API v1 Routes
app.use('/api/v1/plans', studyPlanRoutes);
app.use('/api/v1/sessions', sessionRoutes);

// Catch-all 404 handler
app.use('*', (req: Request, res: Response) => {
  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(globalErrorHandler);

// Start server + background worker
const server = app.listen(PORT, () => {
  logger.info(`${config.serviceName} started`, {
    port: PORT,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });

  // Start BullMQ reschedule worker
  if (config.nodeEnv !== 'test') {
    try {
      startRescheduleWorker();
      logger.info('Reschedule worker started');
    } catch (error) {
      logger.warn('Failed to start reschedule worker (Redis may not be available)', {
        error: (error as Error).message,
      });
    }
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Stop worker and queue
  await stopRescheduleWorker();
  await closeQueue();

  server.close(() => {
    logger.info(`${config.serviceName} shut down complete`);
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
