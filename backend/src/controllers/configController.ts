import { Request, Response } from 'express';
import pool from '../config/database';

// Lấy cấu hình hiện tại
export const getConfig = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT monthly_cutoff_day, daily_deadline_hour, updated_at FROM registration_config LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Nếu chưa có config, tạo mặc định
      const insertResult = await pool.query(
        'INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) VALUES ($1, $2, $3) RETURNING monthly_cutoff_day, daily_deadline_hour, updated_at',
        [25, 20, 'system']
      );
      return res.json(insertResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ message: 'Lỗi khi lấy cấu hình' });
  }
};

// Cập nhật cấu hình
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { monthly_cutoff_day, daily_deadline_hour } = req.body;
    const user = (req as any).user;

    // Validate
    if (monthly_cutoff_day !== undefined) {
      const day = parseInt(monthly_cutoff_day);
      if (isNaN(day) || day < 1 || day > 28) {
        return res.status(400).json({ 
          message: 'Ngày mở đăng ký phải từ 1 đến 28' 
        });
      }
    }

    if (daily_deadline_hour !== undefined) {
      const hour = parseInt(daily_deadline_hour);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return res.status(400).json({ 
          message: 'Giờ đóng đăng ký phải từ 0 đến 23' 
        });
      }
    }

    // Cập nhật
    const result = await pool.query(
      `UPDATE registration_config 
       SET monthly_cutoff_day = COALESCE($1, monthly_cutoff_day),
           daily_deadline_hour = COALESCE($2, daily_deadline_hour),
           updated_at = CURRENT_TIMESTAMP,
           updated_by = $3
       RETURNING monthly_cutoff_day, daily_deadline_hour, updated_at`,
      [monthly_cutoff_day, daily_deadline_hour, user.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy cấu hình' });
    }

    res.json({
      message: 'Cập nhật cấu hình thành công',
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật cấu hình' });
  }
};
