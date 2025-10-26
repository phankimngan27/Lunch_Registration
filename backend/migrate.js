// Migration script - chạy trong Railway environment
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Không cần SSL config vì chạy trong Railway internal network
});

async function migrate() {
  console.log('🚀 Starting migration...');
  
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'railway-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('select')) {
        const result = await client.query(statement);
        console.log('Result:', result.rows);
      } else {
        await client.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('Login: admin@madison.dev / 1234');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
