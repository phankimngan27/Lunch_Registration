import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Setup database endpoint - chỉ dùng 1 lần
router.post('/setup-database', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    
    try {
      // Chạy từng câu lệnh riêng biệt
      await client.query(`
-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    project VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đăng ký cơm
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    registration_date DATE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, registration_date)
);

-- Bảng cấu hình giá
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng cấu hình thời gian đăng ký
CREATE TABLE IF NOT EXISTS registration_config (
    id SERIAL PRIMARY KEY,
    monthly_cutoff_day INTEGER NOT NULL DEFAULT 23 CHECK (monthly_cutoff_day >= 1 AND monthly_cutoff_day <= 28),
    daily_deadline_hour INTEGER NOT NULL DEFAULT 17 CHECK (daily_deadline_hour >= 0 AND daily_deadline_hour <= 23),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_registrations_month_year ON registrations(month, year);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_project ON users(project);

-- Dữ liệu cấu hình
INSERT INTO settings (key, value, description) VALUES 
('lunch_price', '25000', 'Giá một suất cơm (VNĐ)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
SELECT 23, 17, 'system'
WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1);

-- Admin (password: 1234)
INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
('ADMIN001', 'Quản trị viên', 'admin@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Internal', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Nhân viên mẫu
INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
('NV001', 'Phan Thị Kim Ngân', 'ngan.phan.thi.kim@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user'),
('NV002', 'Trần Văn An', 'an.tran.van@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HR', 'Project B', 'user'),
('NV003', 'Lê Thị Bình', 'binh.le.thi@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user'),
('NV004', 'Nguyễn Văn Cường', 'cuong.nguyen.van@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marketing', 'Project C', 'user'),
('NV005', 'Phạm Thị Dung', 'dung.pham.thi@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project B', 'user')
ON CONFLICT (email) DO NOTHING;
      `);

      client.release();
      
      res.json({
        success: true,
        message: 'Database setup thành công! Bạn có thể login với admin@madison.dev / 1234'
      });
    } catch (queryError) {
      client.release();
      throw queryError;
    }
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi setup database',
      error: error.message
    });
  }
});

export default router;
