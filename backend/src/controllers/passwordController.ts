import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { validatePassword } from '../utils/validation';

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    const currentUser = (req as any).user;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check if current user is super admin
    const currentUserResult = await pool.query(
      'SELECT employee_code, email, role FROM users WHERE id = $1',
      [currentUser.id]
    );
    
    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng hiện tại không tồn tại' });
    }

    const currentUserData = currentUserResult.rows[0];
    const isSuperAdmin = currentUserData.employee_code === 'admin' || 
                         currentUserData.email === 'admin@madison.dev';

    // Get target user info
    const targetUserResult = await pool.query(
      'SELECT id, employee_code, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const targetUser = targetUserResult.rows[0];
    const isTargetSuperAdmin = targetUser.employee_code === 'admin' || 
                               targetUser.email === 'admin@madison.dev';

    // Check permissions
    if (isSuperAdmin) {
      // Super admin can change anyone's password
    } else if (currentUserData.role === 'admin') {
      // Regular admin can only change:
      // 1. Their own password
      // 2. Regular user passwords (NOT other admins)
      if (currentUser.id !== parseInt(userId)) {
        // Trying to change someone else's password
        if (targetUser.role === 'admin' || isTargetSuperAdmin) {
          return res.status(403).json({ message: 'Bạn không có quyền đổi mật khẩu của admin khác' });
        }
      }
    } else {
      // Regular users can only change their own password
      if (currentUser.id !== parseInt(userId)) {
        return res.status(403).json({ message: 'Bạn chỉ có thể đổi mật khẩu của chính mình' });
      }
    }

    // Use bcrypt with 10 rounds for better security
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
