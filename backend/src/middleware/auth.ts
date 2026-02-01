import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Không có token xác thực',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Lỗi cấu hình server' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Check if user is still active in database
    const pool = require('../config/database').default;
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: 'Tài khoản không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ 
      message: 'Token không hợp lệ',
      code: 'INVALID_TOKEN'
    });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Không có quyền truy cập. Chỉ admin mới có quyền này.',
      code: 'FORBIDDEN'
    });
  }
  next();
};
