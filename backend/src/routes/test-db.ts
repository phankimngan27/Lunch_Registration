import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Test database connection
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW() as time, version() as version');
    res.json({
      success: true,
      message: 'Database connected!',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Create tables one by one
router.post('/create-tables', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
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
      )
    `);

    // Registrations table
    await client.query(`
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
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        value VARCHAR(255) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Config table
    await client.query(`
      CREATE TABLE IF NOT EXISTS registration_config (
        id SERIAL PRIMARY KEY,
        monthly_cutoff_day INTEGER NOT NULL DEFAULT 23,
        daily_deadline_hour INTEGER NOT NULL DEFAULT 17,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100)
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registration_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_registrations_month_year ON registrations(month, year)`);

    // Insert data
    await client.query(`
      INSERT INTO settings (key, value, description) VALUES 
      ('lunch_price', '25000', 'Giá một suất cơm (VNĐ)')
      ON CONFLICT (key) DO NOTHING
    `);

    await client.query(`
      INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
      SELECT 23, 17, 'system'
      WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1)
    `);

    await client.query(`
      INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
      ('ADMIN001', 'Quản trị viên', 'admin@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Internal', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);

    await client.query(`
      INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
      ('NV001', 'Phan Thị Kim Ngân', 'ngan.phan.thi.kim@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user')
      ON CONFLICT (email) DO NOTHING
    `);

    client.release();

    res.json({
      success: true,
      message: 'All tables created successfully! Login: admin@madison.dev / 1234'
    });
  } catch (error: any) {
    client.release();
    res.status(500).json({
      success: false,
      message: 'Error creating tables',
      error: error.message
    });
  }
});

export default router;
