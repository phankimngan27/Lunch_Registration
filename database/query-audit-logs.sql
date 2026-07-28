-- ============================================
-- Audit Logs Query Helper
-- Common queries for investigating operations
-- ============================================

-- 1. Recent operations (last 24 hours)
SELECT 
  id,
  operation,
  user_email,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  backup_created,
  metadata->>'path' as endpoint
FROM audit_logs
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 2. Operations by type
SELECT 
  operation,
  COUNT(*) as count,
  SUM(CASE WHEN backup_created THEN 1 ELSE 0 END) as backups_created,
  ROUND(100.0 * SUM(CASE WHEN backup_created THEN 1 ELSE 0 END) / COUNT(*), 2) as backup_rate
FROM audit_logs
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY operation
ORDER BY count DESC;

-- 3. Operations by user
SELECT 
  user_email,
  COUNT(*) as total_operations,
  STRING_AGG(DISTINCT operation, ', ') as operations
FROM audit_logs
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_email
ORDER BY total_operations DESC;

-- 4. Failed backups (operations without backup)
SELECT 
  id,
  operation,
  user_email,
  created_at,
  metadata->>'path' as endpoint
FROM audit_logs
WHERE backup_created = false
  AND created_at > CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 5. Detailed view of specific operation
-- Replace 123 with actual audit log ID
SELECT 
  id,
  operation,
  user_email,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  backup_created,
  backup_file,
  jsonb_pretty(metadata) as request_details
FROM audit_logs
WHERE id = 123;

-- 6. Bulk operations timeline
SELECT 
  TO_CHAR(created_at, 'YYYY-MM-DD') as date,
  operation,
  COUNT(*) as count
FROM audit_logs
WHERE operation IN ('BULK_CREATE', 'BULK_DELETE', 'BULK_UPDATE')
GROUP BY date, operation
ORDER BY date DESC, operation;

-- 7. Operations on specific date range
SELECT 
  id,
  operation,
  user_email,
  created_at,
  metadata->'body'->>'date' as affected_date,
  backup_created
FROM audit_logs
WHERE created_at BETWEEN '2026-07-01' AND '2026-07-31'
  AND operation IN ('BULK_DELETE', 'BULK_UPDATE')
ORDER BY created_at DESC;

-- 8. Backup success rate by operation
SELECT 
  operation,
  COUNT(*) as total,
  SUM(CASE WHEN backup_created THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN backup_created THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  MAX(created_at) as last_operation
FROM audit_logs
GROUP BY operation
ORDER BY total DESC;

-- 9. Find specific user's bulk operations
-- Replace 'admin@madison.dev' with actual email
SELECT 
  id,
  operation,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  metadata->'body' as request_body,
  backup_file
FROM audit_logs
WHERE user_email = 'admin@madison.dev'
  AND operation LIKE 'BULK_%'
ORDER BY created_at DESC
LIMIT 20;

-- 10. Cleanup old audit logs (archive first!)
-- Run this monthly to keep table size manageable
-- IMPORTANT: Create archive table first if needed
/*
CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);

INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

DELETE FROM audit_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

SELECT COUNT(*) as archived FROM audit_logs_archive;
SELECT COUNT(*) as remaining FROM audit_logs;
*/
