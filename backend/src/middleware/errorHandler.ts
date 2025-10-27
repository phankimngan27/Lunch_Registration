import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export enum ErrorCode {
    // Authentication errors
    NO_TOKEN = 'NO_TOKEN',
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',

    // Validation errors
    MISSING_FIELDS = 'MISSING_FIELDS',
    INVALID_INPUT = 'INVALID_INPUT',
    INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
    INVALID_EMAIL_DOMAIN = 'INVALID_EMAIL_DOMAIN',

    // User errors
    EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
    ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
    PASSWORD_NOT_SET = 'PASSWORD_NOT_SET',
    WRONG_PASSWORD = 'WRONG_PASSWORD',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
    DUPLICATE_EMPLOYEE_CODE = 'DUPLICATE_EMPLOYEE_CODE',

    // Database errors
    DATABASE_ERROR = 'DATABASE_ERROR',
    QUERY_FAILED = 'QUERY_FAILED',

    // General errors
    SERVER_ERROR = 'SERVER_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    BAD_REQUEST = 'BAD_REQUEST'
}

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code: ErrorCode,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error
    logger.error('Request error', err, {
        method: req.method,
        path: req.path,
        userId: (req as any).user?.id
    });

    // Handle AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(err.details && { details: err.details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // Handle database errors
    if (err.message?.includes('duplicate key')) {
        return res.status(409).json({
            success: false,
            message: 'Dữ liệu đã tồn tại',
            code: ErrorCode.DATABASE_ERROR
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ',
            code: ErrorCode.INVALID_TOKEN
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token đã hết hạn',
            code: ErrorCode.TOKEN_EXPIRED
        });
    }

    // Default server error
    res.status(500).json({
        success: false,
        message: 'Lỗi server không xác định',
        code: ErrorCode.SERVER_ERROR,
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack
        })
    });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
    logger.warn('Route not found', { method: req.method, path: req.path });
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} không tồn tại`,
        code: ErrorCode.NOT_FOUND
    });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
