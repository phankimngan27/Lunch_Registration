const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Lấy connection string từ Railway Variables tab
// Format: postgresql://postgres:PASSWORD@HOST:PORT/railway
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Thiếu DATABASE_URL!');
  console.log('📝 Cách chạy:');
  console.log('   1. Vào Railway → Postgres → Variables');
  console.log('   2. Copy DATABASE_URL');
  console.log('   3. Chạy: DATABASE_URL="<paste-here>" node setup-railway-db.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    
    const sql = fs.readFileSync(path.join(__dirname, '../database/railway-setup.sql'), 'utf8');
    
    console.log('📝 Running SQL setup...');
    await pool.query(sql);
    
    console.log('✅ Database setup thành công!');
    console.log('👤 Admin: admin@madison.dev / 1234');
    console.log('👤 User: ngan.phan.thi.kim@madison.dev / 1234');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
