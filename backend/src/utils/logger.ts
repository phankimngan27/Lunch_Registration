/**
 * Logger utility - Centralized logging with levels and timestamps
 */

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const logMessage = this.formatMessage(LogLevel.ERROR, message, context);
    console.error(logMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error(`  ↳ ${error.message}`);
        if (this.isDevelopment && error.stack) {
          console.error(`  ↳ Stack: ${error.stack}`);
        }
      } else {
        console.error(`  ↳ Details:`, error);
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    const logMessage = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(logMessage);
  }

  info(message: string, context?: LogContext): void {
    const logMessage = this.formatMessage(LogLevel.INFO, message, context);
    console.log(logMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const logMessage = this.formatMessage(LogLevel.DEBUG, message, context);
      console.log(logMessage);
    }
  }

  // Specific methods for common scenarios
  request(method: string, path: string, userId?: number): void {
    this.info(`${method} ${path}`, userId ? { userId } : undefined);
  }

  dbQuery(query: string, params?: any[]): void {
    if (this.isDevelopment) {
      this.debug('DB Query', { query: query.substring(0, 100), params });
    }
  }

  apiResponse(statusCode: number, message: string, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.info(`Response ${statusCode}: ${message}`, context);
  }
}

export const logger = new Logger();
