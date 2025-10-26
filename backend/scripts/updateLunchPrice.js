const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function updateLunchPrice() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Cập nhật giá cơm
    await client.query(`
      UPDATE settings 
      SET value = '20000', 
          description = 'Giá một suất cơm (VNĐ)',
          updated_at = CURRENT_TIMESTAMP
      WHERE key = 'lunch_price'
    `);
    
    console.log('✅ Đã cập nhật giá cơm từ 25,000 → 20,000 VNĐ');
    
    // Kiểm tra lại
    const result = await client.query(`
      SELECT key, value, description 
      FROM settings 
      WHERE key = 'lunch_price'
    `);
    
    if (result.rows.length > 0) {
      const setting = result.rows[0];
      console.log(`\nGiá hiện tại: ${parseInt(setting.value).toLocaleString('vi-VN')} VNĐ`);
    }
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateLunchPrice().catch(console.error);
