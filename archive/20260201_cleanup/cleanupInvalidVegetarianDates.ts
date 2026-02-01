/**
 * Cleanup Invalid Vegetarian Dates
 * 
 * This script fixes corrupted data where is_vegetarian = true for non-vegetarian days.
 * It uses the lunar calendar to accurately determine which dates should be vegetarian.
 * 
 * Usage:
 *   ts-node scripts/cleanupInvalidVegetarianDates.ts
 * 
 * Or add to package.json:
 *   "cleanup-vegetarian": "ts-node scripts/cleanupInvalidVegetarianDates.ts"
 */

import pool from '../src/config/database';
import { isVegetarianDay } from '../src/utils/lunarCalendar';

interface Registration {
  id: number;
  user_id: number;
  registration_date: string;
  is_vegetarian: boolean;
  full_name: string;
  employee_code: string;
}

async function cleanupInvalidVegetarianDates() {
  console.log('🔍 Starting cleanup of invalid vegetarian dates...\n');

  try {
    // Step 1: Get all registrations marked as vegetarian
    console.log('Step 1: Fetching all vegetarian registrations...');
    const result = await pool.query(`
      SELECT 
        r.id,
        r.user_id,
        r.registration_date,
        r.is_vegetarian,
        u.full_name,
        u.employee_code
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_vegetarian = true
      ORDER BY r.registration_date, u.employee_code
    `);

    const registrations: Registration[] = result.rows;
    console.log(`Found ${registrations.length} vegetarian registrations\n`);

    if (registrations.length === 0) {
      console.log('✅ No vegetarian registrations found. Nothing to cleanup.');
      return;
    }

    // Step 2: Check each registration against lunar calendar
    console.log('Step 2: Validating against lunar calendar...');
    const invalidRegistrations: Registration[] = [];
    const validRegistrations: Registration[] = [];

    for (const reg of registrations) {
      const date = new Date(reg.registration_date);
      const isActualVegetarianDay = isVegetarianDay(date);

      if (isActualVegetarianDay) {
        validRegistrations.push(reg);
      } else {
        invalidRegistrations.push(reg);
      }
    }

    console.log(`✅ Valid vegetarian dates: ${validRegistrations.length}`);
    console.log(`❌ Invalid vegetarian dates: ${invalidRegistrations.length}\n`);

    if (invalidRegistrations.length === 0) {
      console.log('✅ All vegetarian dates are valid. Nothing to cleanup.');
      return;
    }

    // Step 3: Show invalid registrations
    console.log('Invalid vegetarian registrations:');
    console.log('─'.repeat(80));
    console.log('ID\tDate\t\tUser\t\t\tEmployee Code');
    console.log('─'.repeat(80));
    
    invalidRegistrations.forEach(reg => {
      const dateStr = new Date(reg.registration_date).toLocaleDateString('vi-VN');
      console.log(`${reg.id}\t${dateStr}\t${reg.full_name.padEnd(20)}\t${reg.employee_code}`);
    });
    console.log('─'.repeat(80));
    console.log();

    // Step 4: Ask for confirmation (in production, you might want to skip this)
    console.log(`⚠️  About to fix ${invalidRegistrations.length} invalid vegetarian dates`);
    console.log('This will set is_vegetarian = false for these registrations');
    console.log();

    // In a real script, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically

    // Step 5: Create backup
    console.log('Step 3: Creating backup...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations_backup_vegetarian_${Date.now()} AS 
      SELECT * FROM registrations WHERE is_vegetarian = true
    `);
    console.log('✅ Backup created\n');

    // Step 6: Fix invalid registrations
    console.log('Step 4: Fixing invalid vegetarian dates...');
    const invalidIds = invalidRegistrations.map(r => r.id);
    
    const updateResult = await pool.query(`
      UPDATE registrations
      SET is_vegetarian = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::int[])
    `, [invalidIds]);

    console.log(`✅ Fixed ${updateResult.rowCount} registrations\n`);

    // Step 7: Verify cleanup
    console.log('Step 5: Verifying cleanup...');
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM registrations
      WHERE is_vegetarian = true
    `);

    console.log(`Remaining vegetarian registrations: ${verifyResult.rows[0].count}`);
    console.log();

    // Step 8: Show summary by date
    console.log('Summary of remaining vegetarian dates:');
    const summaryResult = await pool.query(`
      SELECT 
        registration_date,
        COUNT(*) as count
      FROM registrations
      WHERE is_vegetarian = true
      GROUP BY registration_date
      ORDER BY registration_date
    `);

    if (summaryResult.rows.length > 0) {
      console.log('─'.repeat(40));
      console.log('Date\t\t\tCount');
      console.log('─'.repeat(40));
      summaryResult.rows.forEach(row => {
        const dateStr = new Date(row.registration_date).toLocaleDateString('vi-VN');
        console.log(`${dateStr}\t\t${row.count}`);
      });
      console.log('─'.repeat(40));
    } else {
      console.log('No vegetarian registrations remaining');
    }

    console.log();
    console.log('✅ Cleanup completed successfully!');
    console.log();
    console.log('Summary:');
    console.log(`  - Total checked: ${registrations.length}`);
    console.log(`  - Valid: ${validRegistrations.length}`);
    console.log(`  - Fixed: ${invalidRegistrations.length}`);
    console.log(`  - Remaining: ${verifyResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
cleanupInvalidVegetarianDates()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
