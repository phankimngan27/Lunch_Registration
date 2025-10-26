// Migration with inline SQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('🚀 Starting migration...');
  
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database');

    // Create users table
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
    console.log('✅ Created users table');

    // Create registrations table
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
    console.log('✅ Created registrations table');

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        value VARCHAR(255) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created settings table');

    // Create config table
    await client.query(`
      CREATE TABLE IF NOT EXISTS registration_config (
        id SERIAL PRIMARY KEY,
        monthly_cutoff_day INTEGER NOT NULL DEFAULT 23,
        daily_deadline_hour INTEGER NOT NULL DEFAULT 17,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100)
      )
    `);
    console.log('✅ Created registration_config table');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registration_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_registrations_month_year ON registrations(month, year)`);
    console.log('✅ Created indexes');

    // Insert settings
    await client.query(`
      INSERT INTO settings (key, value, description) VALUES 
      ('lunch_price', '25000', 'Giá một suất cơm (VNĐ)')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ Inserted settings');

    // Insert config
    await client.query(`
      INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
      SELECT 23, 17, 'system'
      WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1)
    `);
    console.log('✅ Inserted config');

    // Insert admin
    await client.query(`
      INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
      ('ADMIN001', 'Quản trị viên', 'admin@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Internal', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Created admin user');

    // Insert sample user
    await client.query(`
      INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
      ('NV001', 'Phan Thị Kim Ngân', 'ngan.phan.thi.kim@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Created sample user');

    // Verify
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n🎉 Migration completed! Total users: ${result.rows[0].count}`);
    console.log('Login: admin@madison.dev / 1234');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  process.exit(1);
});
