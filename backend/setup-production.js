// Setup database for production
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Lấy DATABASE_URL từ Railway variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL không tồn tại!');
  console.log('Chạy: railway run node setup-production.js');
  process.exit(1);
}

console.log('🔗 Connecting to database...');

const pool = new Pool({
  connectionString: databaseUrl,
});

async function setup() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../database/railway-setup.sql'),
      'utf8'
    );

    console.log('📝 Running setup SQL...');
    await pool.query(sql);

    console.log('✅ Database setup thành công!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Admin: admin@madison.dev / 1234');
    console.log('  User: ngan.phan.thi.kim@madison.dev / 1234');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setup();
