import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    message: 'Không tìm thấy endpoint',
    path: req.path,
  });
};

// Global error handler
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(500).json({
    message: 'Lỗi server',
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};
