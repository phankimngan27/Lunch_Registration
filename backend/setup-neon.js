// Setup database for Neon.tech
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Lấy DATABASE_URL từ environment hoặc argument
const databaseUrl = process.env.DATABASE_URL || process.argv[2];

if (!databaseUrl) {
  console.error('❌ DATABASE_URL không tồn tại!');
  console.log('');
  console.log('Cách dùng:');
  console.log('  DATABASE_URL="postgresql://..." node setup-neon.js');
  console.log('  hoặc');
  console.log('  node setup-neon.js "postgresql://..."');
  process.exit(1);
}

console.log('🔗 Connecting to Neon database...');
console.log('URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Neon requires SSL
  }
});

async function setup() {
  try {
    await client.connect();
    console.log('✅ Connected to Neon!');

    const sql = fs.readFileSync(
      path.join(__dirname, '../database/setup.sql'),
      'utf8'
    );

    console.log('📝 Running setup SQL...');
    
    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      // Skip SELECT statements used for display
      if (statement.toLowerCase().startsWith('select \'')) {
        continue;
      }
      try {
        await client.query(statement);
      } catch (err) {
        // Ignore errors for statements that might already exist
        if (!err.message.includes('already exists')) {
          console.warn('⚠️  Warning:', err.message.split('\n')[0]);
        }
      }
    }

    console.log('✅ Database setup thành công!');
    console.log('');
    console.log('🎉 Hoàn tất! Bạn có thể login với:');
    console.log('  👤 Admin: admin@madison.dev / 1234');
    console.log('  👤 User: ngan.phan.thi.kim@madison.dev / 1234');
    console.log('');
    console.log('📊 Sample data:');
    console.log('  - 6 users (1 admin + 5 employees)');
    console.log('  - Sample registrations for October 2024');
    console.log('');
    console.log('📊 Kiểm tra database tại: https://console.neon.tech');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('');
    console.error('Gợi ý:');
    console.error('  - Kiểm tra connection string có đúng không');
    console.error('  - Đảm bảo có ?sslmode=require ở cuối URL');
    console.error('  - Kiểm tra database có đang active không (Neon auto-suspend)');

    try {
      await client.end();
    } catch (e) { }
    process.exit(1);
  }
}

setup();
