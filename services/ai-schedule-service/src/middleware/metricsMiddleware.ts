import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationMicroseconds } from '../utils/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode.toString(),
      },
      duration
    );
  });

  next();
};
