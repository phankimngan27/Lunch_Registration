import pool from '../src/config/database';

async function cleanupOldRegistrations() {
  try {
    console.log('🧹 Starting cleanup of old registrations...');
    
    // Check how many old records exist
    const checkResult = await pool.query(
      `SELECT COUNT(*) as old_records_count, 
              MIN(registration_date) as earliest_date,
              MAX(registration_date) as latest_date
       FROM registrations 
       WHERE year < 2026`
    );
    
    console.log('📊 Old records found:', checkResult.rows[0]);
    
    if (parseInt(checkResult.rows[0].old_records_count) === 0) {
      console.log('✅ No old records to clean up');
      process.exit(0);
    }
    
    // Delete old registrations
    const deleteResult = await pool.query(
      'DELETE FROM registrations WHERE year < 2026'
    );
    
    console.log(`✅ Deleted ${deleteResult.rowCount} old records`);
    
    // Verify cleanup
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as remaining_records,
              MIN(registration_date) as earliest_date,
              MAX(registration_date) as latest_date
       FROM registrations`
    );
    
    console.log('📊 Remaining records:', verifyResult.rows[0]);
    console.log('✅ Cleanup completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupOldRegistrations();
