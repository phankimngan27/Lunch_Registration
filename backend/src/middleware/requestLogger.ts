import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logger middleware - logs all incoming requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  const userId = (req as any).user?.id;
  logger.request(req.method, req.path, userId);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logContext = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...(userId && { userId })
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${res.statusCode}`, logContext);
    } else {
      logger.debug(`${req.method} ${req.path} - ${res.statusCode}`, logContext);
    }
  });

  next();
};
