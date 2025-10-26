-- =====================================================
-- MADISON TECHNOLOGIES - LUNCH REGISTRATION SYSTEM
-- Database Setup Script
-- =====================================================
-- 
-- Hướng dẫn:
-- 1. Tạo database: CREATE DATABASE lunch_registration;
-- 2. Kết nối: \c lunch_registration
-- 3. Chạy file này: \i database/setup.sql
-- 
-- Hoặc: psql -U postgres -d lunch_registration -f database/setup.sql
-- =====================================================

-- =====================================================
-- Bước 2: Tạo các bảng
-- =====================================================

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    project VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user', -- 'admin' hoặc 'user'
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
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled'
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

-- =====================================================
-- Bước 3: Tạo indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_registrations_month_year ON registrations(month, year);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_project ON users(project);

-- =====================================================
-- Bước 4: Thêm dữ liệu cấu hình
-- =====================================================

INSERT INTO settings (key, value, description) VALUES 
('lunch_price', '25000', 'Giá một suất cơm (VNĐ)')
ON CONFLICT (key) DO NOTHING;

-- Thêm cấu hình mặc định cho thời gian đăng ký
INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
SELECT 23, 17, 'system'
WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1);

-- =====================================================
-- Bước 5: Tạo user mẫu (password: 1234)
-- Hash của password '1234': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- =====================================================

-- Admin
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

-- =====================================================
-- Bước 6: Tạo đăng ký mẫu
-- =====================================================

INSERT INTO registrations (user_id, registration_date, month, year) VALUES 
(2, '2024-10-01', 10, 2024),
(2, '2024-10-02', 10, 2024),
(2, '2024-10-03', 10, 2024),
(3, '2024-10-01', 10, 2024),
(3, '2024-10-02', 10, 2024),
(4, '2024-10-01', 10, 2024)
ON CONFLICT (user_id, registration_date) DO NOTHING;

-- =====================================================
-- HOÀN TẤT!
-- =====================================================

SELECT 'Setup hoàn tất! Bạn có thể đăng nhập với:' as message;
SELECT 'Email: ngan.phan.thi.kim@madison.dev' as user_info;
SELECT 'Password: 1234' as password_info;
