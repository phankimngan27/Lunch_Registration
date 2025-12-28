import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export const login = async (req: Request, res: Response) => {
  const startTime = Date.now();
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
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const loginTime = Date.now() - startTime;
    console.log(`✅ Login successful for ${email} in ${loginTime}ms`);

    res.json({
      token,
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
    const loginTime = Date.now() - startTime;
    console.error(`❌ Login failed after ${loginTime}ms:`, error);
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
    console.error('Lỗi lấy thông tin:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
