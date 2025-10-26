import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    const currentUser = (req as any).user;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Check if current user is super admin
    const currentUserResult = await pool.query(
      'SELECT employee_code, email FROM users WHERE id = $1',
      [currentUser.id]
    );
    const isSuperAdmin = currentUserResult.rows[0]?.employee_code === 'admin' || 
                         currentUserResult.rows[0]?.email === 'admin@madison.dev';

    // Get target user info
    const targetUserResult = await pool.query(
      'SELECT id, employee_code, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const targetUser = targetUserResult.rows[0];

    // Check permissions
    if (isSuperAdmin) {
      // Super admin can change anyone's password
    } else if (currentUser.role === 'admin') {
      // Regular admin can change their own password and user passwords
      if (currentUser.id !== parseInt(userId) && targetUser.role === 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền đổi mật khẩu của admin khác' });
      }
    } else {
      // Regular users can only change their own password
      if (currentUser.id !== parseInt(userId)) {
        return res.status(403).json({ message: 'Bạn chỉ có thể đổi mật khẩu của chính mình' });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
