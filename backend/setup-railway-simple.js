const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Thiếu DATABASE_URL!');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString + '?sslmode=require'
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    
    const sql = fs.readFileSync(path.join(__dirname, '../database/railway-setup.sql'), 'utf8');
    
    console.log('📝 Running SQL setup...');
    await client.query(sql);
    
    console.log('✅ Database setup thành công!');
    console.log('👤 Admin: admin@madison.dev / 1234');
    console.log('👤 User: ngan.phan.thi.kim@madison.dev / 1234');
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

setupDatabase();
