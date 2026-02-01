import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Vui lòng nhập đầy đủ email và mật khẩu',
        errorType: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Email không đúng định dạng. Vui lòng nhập email hợp lệ',
        errorType: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Validate email domain
    if (!email.endsWith('@madison.dev')) {
      return res.status(400).json({ 
        message: 'Email phải có định dạng @madison.dev (ví dụ: ten.cua.ban@madison.dev)',
        errorType: 'INVALID_EMAIL_DOMAIN'
      });
    }

    // Check if user exists and is active
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: 'Email không tồn tại trong hệ thống. Vui lòng liên hệ quản trị viên để được cấp tài khoản.',
        errorType: 'EMAIL_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        errorType: 'ACCOUNT_DISABLED'
      });
    }
    
    // Validate password
    if (!user.password_hash) {
      return res.status(500).json({ 
        message: 'Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.',
        errorType: 'PASSWORD_NOT_SET'
      });
    }

    // Compare password with hash in database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Mật khẩu không đúng. Vui lòng thử lại hoặc liên hệ quản trị viên để đặt lại mật khẩu.',
        errorType: 'WRONG_PASSWORD'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    
    // Generate access token (short-lived: 15 minutes)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, type: 'refresh' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    await pool.query(
      `UPDATE users 
       SET refresh_token = $1, refresh_token_expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $2`,
      [refreshToken, user.id]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        employee_code: user.employee_code,
        full_name: user.full_name,
        email: user.email,
        department: user.department,
        phone_number: user.phone_number,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(
      'SELECT id, employee_code, full_name, email, department, phone_number, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Refresh token endpoint
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ 
        message: 'Refresh token không hợp lệ',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_secret';

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, jwtSecret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          message: 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        message: 'Refresh token không hợp lệ',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        message: 'Token không phải là refresh token',
        code: 'NOT_REFRESH_TOKEN'
      });
    }

    // Check if refresh token exists in database and is not expired
    const result = await pool.query(
      `SELECT id, email, role, is_active, refresh_token, refresh_token_expires_at 
       FROM users 
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Tài khoản đã bị vô hiệu hóa',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Check if refresh token matches
    if (user.refresh_token !== refreshToken) {
      return res.status(401).json({ 
        message: 'Refresh token không hợp lệ',
        code: 'REFRESH_TOKEN_MISMATCH'
      });
    }

    // Check if refresh token is expired
    if (new Date() > new Date(user.refresh_token_expires_at)) {
      return res.status(401).json({ 
        message: 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Logout endpoint (invalidate refresh token)
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Clear refresh token from database
    await pool.query(
      `UPDATE users 
       SET refresh_token = NULL, refresh_token_expires_at = NULL
       WHERE id = $1`,
      [userId]
    );

    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
