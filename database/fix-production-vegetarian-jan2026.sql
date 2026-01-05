-- Fix Production Vegetarian Data for January 2026
-- Run this on production database to cleanup invalid vegetarian registrations
-- 
-- VERIFIED VEGETARIAN DAYS IN JANUARY 2026:
-- - 2026-01-03 = Lunar 15/11/2025 (Rằm tháng 11) ✅
-- - 2026-01-19 = Lunar 1/12/2025 (Mùng 1 tháng 12) ✅
-- - 2026-01-06 = Lunar 18/11/2025 ❌ NOT VEGETARIAN

-- ============================================
-- STEP 1: BACKUP (CRITICAL!)
-- ============================================
CREATE TABLE IF NOT EXISTS registrations_backup_jan2026 AS 
SELECT * FROM registrations 
WHERE registration_date >= '2026-01-01' 
AND registration_date < '2026-02-01'
AND is_vegetarian = true;

SELECT 'Backup created. Rows backed up: ' || COUNT(*) FROM registrations_backup_jan2026;

-- ============================================
-- STEP 2: CHECK CURRENT DATA
-- ============================================
SELECT 
    r.id,
    r.user_id,
    u.full_name,
    u.employee_code,
    r.registration_date,
    r.is_vegetarian,
    r.status,
    EXTRACT(DAY FROM r.registration_date) as day
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.registration_date >= '2026-01-01'
AND r.registration_date < '2026-02-01'
AND r.is_vegetarian = true
ORDER BY r.registration_date, u.employee_code;

-- ============================================
-- STEP 3: FIX INVALID VEGETARIAN DATES
-- ============================================
-- Reset is_vegetarian for ALL dates except the 2 valid vegetarian days
UPDATE registrations
SET is_vegetarian = false
WHERE registration_date >= '2026-01-01' 
AND registration_date < '2026-02-01'
AND is_vegetarian = true
AND registration_date NOT IN ('2026-01-03', '2026-01-19');

-- Show how many rows were updated
SELECT 'Fixed invalid vegetarian dates. Rows updated: ' || ROW_COUNT();

-- ============================================
-- STEP 4: VERIFY RESULTS
-- ============================================
-- Check what's left (should only show Jan 2 and Jan 18)
SELECT 
    r.registration_date,
    COUNT(*) as total_registrations,
    COUNT(*) FILTER (WHERE is_vegetarian = true) as vegetarian_count,
    STRING_AGG(DISTINCT u.full_name, ', ') as vegetarian_users
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.registration_date >= '2026-01-01'
AND r.registration_date < '2026-02-01'
AND r.status = 'active'
GROUP BY r.registration_date
HAVING COUNT(*) FILTER (WHERE is_vegetarian = true) > 0
ORDER BY r.registration_date;

-- ============================================
-- STEP 5: CHECK SPECIFIC DATE (Jan 6)
-- ============================================
-- This should return 0 rows with is_vegetarian = true
SELECT 
    r.id,
    r.user_id,
    u.full_name,
    u.employee_code,
    r.registration_date,
    r.is_vegetarian,
    r.status
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.registration_date = '2026-01-06'
AND r.is_vegetarian = true;

-- If above query returns 0 rows, the fix is successful!

-- ============================================
-- ROLLBACK (If needed)
-- ============================================
-- If something goes wrong, restore from backup:
-- UPDATE registrations r
-- SET is_vegetarian = b.is_vegetarian
-- FROM registrations_backup_jan2026 b
-- WHERE r.id = b.id;

-- ============================================
-- CLEANUP BACKUP TABLE (After verification)
-- ============================================
-- Once verified everything is correct, drop backup:
-- DROP TABLE registrations_backup_jan2026;
