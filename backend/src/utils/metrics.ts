import { logger } from './logger';

// Simple in-memory metrics store
interface Metrics {
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    slowRequests: number;
  };
}

const metrics: Metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byStatus: {},
  },
  errors: {
    total: 0,
    byType: {},
  },
  performance: {
    avgResponseTime: 0,
    slowRequests: 0,
  },
};

let responseTimes: number[] = [];

export const recordRequest = (method: string, statusCode: number, duration: number) => {
  metrics.requests.total++;
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
  metrics.requests.byStatus[statusCode] = (metrics.requests.byStatus[statusCode] || 0) + 1;

  // Track response times
  responseTimes.push(duration);
  if (responseTimes.length > 1000) {
    responseTimes = responseTimes.slice(-1000); // Keep last 1000
  }

  // Calculate average
  const sum = responseTimes.reduce((a, b) => a + b, 0);
  metrics.performance.avgResponseTime = Math.round(sum / responseTimes.length);

  // Track slow requests
  if (duration > 1000) {
    metrics.performance.slowRequests++;
  }
};

export const recordError = (errorType: string) => {
  metrics.errors.total++;
  metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
};

export const getMetrics = (): Metrics => {
  return { ...metrics };
};

export const resetMetrics = () => {
  metrics.requests.total = 0;
  metrics.requests.byMethod = {};
  metrics.requests.byStatus = {};
  metrics.errors.total = 0;
  metrics.errors.byType = {};
  metrics.performance.avgResponseTime = 0;
  metrics.performance.slowRequests = 0;
  responseTimes = [];
};

// Log metrics every hour
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.info('Hourly metrics', getMetrics());
  }, 60 * 60 * 1000);
}
