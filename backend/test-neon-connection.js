// Test Neon database connection
const { Client } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || process.argv[2];

if (!databaseUrl) {
  console.error('❌ DATABASE_URL không tồn tại!');
  console.log('Cách dùng: DATABASE_URL="postgresql://..." node test-neon-connection.js');
  process.exit(1);
}

console.log('🔗 Testing connection to Neon...');
console.log('URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('⏳ Connecting... (có thể mất vài giây nếu database đang sleep)');
    const startTime = Date.now();
    
    await client.connect();
    const connectTime = Date.now() - startTime;
    
    console.log(`✅ Connected! (${connectTime}ms)`);

    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('');
    console.log('📊 Database Info:');
    console.log('  Version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    console.log('  Database:', result.rows[0].current_database);
    console.log('  User:', result.rows[0].current_user);

    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('');
    console.log('📋 Tables:');
    if (tables.rows.length === 0) {
      console.log('  (chưa có table nào - cần chạy setup)');
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Check users count
    try {
      const users = await client.query('SELECT COUNT(*) as count FROM users');
      console.log('');
      console.log(`👥 Total users: ${users.rows[0].count}`);
    } catch (e) {
      // Table doesn't exist yet
    }

    await client.end();
    console.log('');
    console.log('✅ Connection test thành công!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Lỗi:', error.message);
    console.error('');
    console.error('Gợi ý:');
    console.error('  - Kiểm tra connection string');
    console.error('  - Đảm bảo có ?sslmode=require');
    console.error('  - Kiểm tra Neon dashboard: https://console.neon.tech');
    
    try {
      await client.end();
    } catch (e) {}
    process.exit(1);
  }
}

test();
