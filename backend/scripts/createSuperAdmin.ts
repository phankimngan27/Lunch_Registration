import bcrypt from 'bcryptjs';
import pool from '../src/config/database';

async function createSuperAdmin() {
  try {
    const employeeCode = 'admin';
    const email = 'admin@madison.dev';
    const password = 'admin1234';
    const fullName = 'Super Admin';

    // Hash password (10 rounds for security consistency)
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE employee_code = $1 OR email = $2',
      [employeeCode, email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin account already exists. Updating...');
      
      // Update existing admin
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, full_name = $2, role = 'admin', is_active = true, updated_at = CURRENT_TIMESTAMP
         WHERE employee_code = $3 OR email = $4`,
        [passwordHash, fullName, employeeCode, email]
      );
      
      console.log('✅ Admin account updated successfully!');
    } else {
      // Create new admin
      await pool.query(
        `INSERT INTO users (employee_code, full_name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, 'admin', true)`,
        [employeeCode, fullName, email, passwordHash]
      );
      
      console.log('✅ Admin account created successfully!');
    }

    console.log('\n📋 Admin credentials:');
    console.log('   Employee Code: admin');
    console.log('   Email: admin@madison.dev');
    console.log('   Password: admin1234');
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
