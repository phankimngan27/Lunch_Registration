import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const setupSQL = `
-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng registrations
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

-- Tạo bảng settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng registration_config
CREATE TABLE IF NOT EXISTS registration_config (
    id SERIAL PRIMARY KEY,
    monthly_cutoff_day INTEGER NOT NULL DEFAULT 23,
    daily_deadline_hour INTEGER NOT NULL DEFAULT 17,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_registrations_month_year ON registrations(month, year);

-- Thêm settings
INSERT INTO settings (key, value, description) VALUES 
('lunch_price', '25000', 'Giá một suất cơm (VNĐ)')
ON CONFLICT (key) DO NOTHING;

-- Thêm config
INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
SELECT 23, 17, 'system'
WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1);

-- Tạo admin (password: 1234)
INSERT INTO users (employee_code, full_name, email, password_hash, department, phone_number, role) VALUES 
('ADMIN001', 'Quản trị viên', 'admin@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', NULL, 'admin')
ON CONFLICT (email) DO NOTHING;

-- Tạo user mẫu (password: 1234)
INSERT INTO users (employee_code, full_name, email, password_hash, department, phone_number, role) VALUES 
('NV001', 'Phan Thị Kim Ngân', 'ngan.phan.thi.kim@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', NULL, 'user')
ON CONFLICT (email) DO NOTHING;
`;

async function setupDatabase() {
  // Use internal URL when running via Railway CLI
  const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL không tồn tại');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  console.log('URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  // Try without SSL first for Railway proxy
  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    console.log('📝 Running setup SQL...');
    await pool.query(setupSQL);
    console.log('✅ Database setup thành công!');
    console.log('');
    console.log('Bạn có thể login với:');
    console.log('  Email: admin@madison.dev');
    console.log('  Password: 1234');
  } catch (error: any) {
    console.error('❌ Lỗi setup database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
