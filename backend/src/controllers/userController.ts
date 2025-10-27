import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { logger } from '../utils/logger';

// Helper function to check if user is super admin
const isSuperAdmin = (employee_code: string, email: string): boolean => {
  return employee_code === 'admin' || email === 'admin@madison.dev';
};

// Helper function to get current user info
const getCurrentUserInfo = async (userId: number) => {
  const result = await pool.query(
    'SELECT employee_code, email FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search, department, project } = req.query;
    
    let query = 'SELECT id, employee_code, full_name, email, department, project, role, is_active FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (full_name ILIKE $${paramCount} OR employee_code ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (department) {
      query += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (project) {
      query += ` AND project = $${paramCount}`;
      params.push(project);
    }

    query += ' ORDER BY employee_code';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to get users', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { employee_code, full_name, email, password, department, project, role } = req.body;
    const currentUser = (req as any).user;

    if (!employee_code || !full_name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Check if current user is super admin
    const currentUserInfo = await getCurrentUserInfo(currentUser.id);
    const isCurrentUserSuperAdmin = isSuperAdmin(currentUserInfo.employee_code, currentUserInfo.email);

    // Nếu không phải super admin, không được tạo user với role admin
    if (!isCurrentUserSuperAdmin && role === 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền tạo tài khoản admin' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, employee_code, full_name, email, department, project, role`,
      [employee_code, full_name, email, hashedPassword, department, project, role || 'user']
    );

    logger.info('User created', { employee_code, email, role });
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Mã nhân viên hoặc email đã tồn tại' });
    }
    logger.error('Failed to create user', error, { employee_code: req.body.employee_code });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { employee_code, full_name, email, department, project, role, is_active } = req.body;
    const currentUser = (req as any).user;

    if (!employee_code || !full_name || !email) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Check if current user is super admin
    const currentUserInfo = await getCurrentUserInfo(currentUser.id);
    const isCurrentUserSuperAdmin = isSuperAdmin(currentUserInfo.employee_code, currentUserInfo.email);

    // Check if this is the super admin account being edited
    const userCheck = await pool.query(
      'SELECT employee_code, email, role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    const user = userCheck.rows[0];
    const isTargetUserSuperAdmin = isSuperAdmin(user.employee_code, user.email);
    
    // Protect super admin account
    if (isTargetUserSuperAdmin) {
      if (employee_code !== 'admin' || email !== 'admin@madison.dev') {
        return res.status(403).json({ message: 'Không thể thay đổi mã nhân viên hoặc email của tài khoản Super Admin' });
      }
      if (is_active === false) {
        return res.status(403).json({ message: 'Không thể vô hiệu hóa tài khoản Super Admin' });
      }
      if (role !== 'admin') {
        return res.status(403).json({ message: 'Không thể thay đổi quyền của tài khoản Super Admin' });
      }
    }

    // Nếu không phải super admin, không được sửa user có role admin
    if (!isCurrentUserSuperAdmin && user.role === 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tài khoản admin' });
    }

    // Nếu không phải super admin, không được thay đổi role thành admin
    if (!isCurrentUserSuperAdmin && role === 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền cấp quyền admin' });
    }

    const result = await pool.query(
      `UPDATE users SET employee_code = $1, full_name = $2, email = $3, department = $4, 
       project = $5, role = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 RETURNING id, employee_code, full_name, email, department, project, role, is_active`,
      [employee_code, full_name, email, department, project, role, is_active !== false, id]
    );

    logger.info('User updated', { id, employee_code, email });
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Mã nhân viên hoặc email đã tồn tại' });
    }
    logger.error('Failed to update user', error, { id: req.params.id });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Check if current user is super admin
    const currentUserInfo = await getCurrentUserInfo(currentUser.id);
    const isCurrentUserSuperAdmin = isSuperAdmin(currentUserInfo.employee_code, currentUserInfo.email);

    // Check if this is the super admin account or an admin account
    const userCheck = await pool.query(
      'SELECT employee_code, email, role, is_active FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    const user = userCheck.rows[0];
    const isTargetUserSuperAdmin = isSuperAdmin(user.employee_code, user.email);
    
    // Không ai được vô hiệu hóa super admin
    if (isTargetUserSuperAdmin) {
      return res.status(403).json({ message: 'Không thể vô hiệu hóa tài khoản Super Admin' });
    }

    // Nếu không phải super admin, không được thay đổi trạng thái user có role admin
    if (!isCurrentUserSuperAdmin && user.role === 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thay đổi trạng thái tài khoản admin' });
    }

    // Toggle is_active status
    const newStatus = !user.is_active;
    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, employee_code, full_name, is_active',
      [newStatus, id]
    );

    logger.info('User status toggled', { id, employee_code: user.employee_code, newStatus });
    res.json({ 
      message: newStatus ? 'Kích hoạt tài khoản thành công' : 'Vô hiệu hóa tài khoản thành công',
      user: result.rows[0]
    });
  } catch (error) {
    logger.error('Failed to toggle user status', error, { id: req.params.id });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Keep deleteUser for backward compatibility but mark as deprecated
export const deleteUser = toggleUserStatus;
