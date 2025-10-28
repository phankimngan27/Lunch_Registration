const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lunch_registration',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function resetAllPasswords() {
  try {
    const defaultPassword = process.env.DEFAULT_PASSWORD || '1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 8);

    console.log(`🔄 Đang reset tất cả password thành: ${defaultPassword}`);

    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       RETURNING id, employee_code, full_name, email, role`,
      [hashedPassword]
    );

    console.log(`✅ Đã reset password cho ${result.rows.length} users:`);
    console.log('');
    
    result.rows.forEach(user => {
      console.log(`  - ${user.full_name} (${user.email})`);
      console.log(`    Employee Code: ${user.employee_code}`);
      console.log(`    Role: ${user.role}`);
      console.log('');
    });

    console.log(`📝 Tất cả users có thể đăng nhập với password: ${defaultPassword}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

resetAllPasswords();
