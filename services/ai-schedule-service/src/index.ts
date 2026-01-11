import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import studyPlanRoutes from './routes/studyPlanRoutes';
import { createLogger } from './utils/logger';

const logger = createLogger('api-server');
import config from './config'; // Using new config
import globalErrorHandler from './middleware/errorHandler'; // Using new error handler

// Initialize Express app
const app = express();
const PORT = config.port;

// Middleware
app.use(helmet());
app.use(cors(config.cors)); // Use config
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// MVP API Routes (matching requirements)
app.use('/plans', studyPlanRoutes);  // /plans/generate, /plans/:id
app.use('/sessions', studyPlanRoutes);  // /sessions/:id/status, /sessions/:id/remarks

// Legacy API v1 Routes (for backward compatibility)
app.use('/api/v1/plans', studyPlanRoutes);
app.use('/api/v1/sessions', studyPlanRoutes);

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

// Start server
const server = app.listen(PORT, () => {
  logger.info(`${config.serviceName} started`, {
    port: PORT,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info(`${config.serviceName} shut down complete`);
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
