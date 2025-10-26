const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Dùng public connection string từ Railway
const connectionString = 'postgresql://postgres:xQMZUtKhGYjPPbXaKoVsgDioZyCaSuoM@centerbeam.proxy.rlwy.net:30408/railway';

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
    ssl: false // Railway proxy không cần SSL
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    
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
    try {
      await client.end();
    } catch (e) {}
    process.exit(1);
  }
}

setupDatabase();
