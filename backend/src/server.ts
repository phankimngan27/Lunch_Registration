import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import setupRoutes from './routes/setup';
import adminSetupRoutes from './routes/admin-setup';
import testDbRoutes from './routes/test-db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);
app.use('/api', setupRoutes);
app.use('/api', adminSetupRoutes);
app.use('/api', testDbRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server đang chạy',
    timestamp: new Date().toISOString()
  });
});

// Database setup endpoint - ONE TIME USE ONLY
app.post('/setup-db-now', async (req, res) => {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    await pool.query(`
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

      CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(50) UNIQUE NOT NULL,
          value VARCHAR(255) NOT NULL,
          description TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS registration_config (
          id SERIAL PRIMARY KEY,
          monthly_cutoff_day INTEGER NOT NULL DEFAULT 23,
          daily_deadline_hour INTEGER NOT NULL DEFAULT 17,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by VARCHAR(100)
      );

      CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
      CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registration_date);
      CREATE INDEX IF NOT EXISTS idx_registrations_month_year ON registrations(month, year);

      INSERT INTO settings (key, value, description) VALUES 
      ('lunch_price', '25000', 'Giá một suất cơm (VNĐ)')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
      SELECT 23, 17, 'system'
      WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1);

      INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
      ('ADMIN001', 'Quản trị viên', 'admin@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Internal', 'admin')
      ON CONFLICT (email) DO NOTHING;

      INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
      ('NV001', 'Phan Thị Kim Ngân', 'ngan.phan.thi.kim@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user')
      ON CONFLICT (email) DO NOTHING;
    `);
    
    await pool.end();
    
    res.json({ 
      success: true,
      message: 'Database setup thành công! Login: admin@madison.dev / 1234'
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi setup database',
      error: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route không tồn tại' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
