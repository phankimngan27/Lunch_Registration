import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Track slow requests
const SLOW_REQUEST_THRESHOLD = 1000; // 1 second

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    // Log slow requests
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        memoryDelta: {
          heapUsed: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
          external: `${((endMemory.external - startMemory.external) / 1024 / 1024).toFixed(2)}MB`,
        },
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Memory usage monitor (run periodically)
export const logMemoryUsage = () => {
  const usage = process.memoryUsage();
  
  logger.info('Memory usage', {
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`,
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
  });
};

// Start memory monitoring (every 5 minutes)
if (process.env.NODE_ENV === 'production') {
  setInterval(logMemoryUsage, 5 * 60 * 1000);
}
