-- ============================================
-- Migration: Add audit_logs table
-- Purpose: Track all dangerous operations for forensics
-- Date: 2026-07-28
-- ============================================

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  operation VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  metadata JSONB,
  backup_created BOOLEAN DEFAULT false,
  backup_file VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit trail for dangerous operations (bulk updates, deletes, etc.)';
COMMENT ON COLUMN audit_logs.operation IS 'Operation type: BULK_CREATE, BULK_DELETE, BULK_UPDATE, USER_IMPORT, etc.';
COMMENT ON COLUMN audit_logs.metadata IS 'JSON containing request details (path, method, IP, body)';
COMMENT ON COLUMN audit_logs.backup_created IS 'Whether physical backup was created before operation';
COMMENT ON COLUMN audit_logs.backup_file IS 'Path to backup file if created';

-- Verify table created
\dt audit_logs
SELECT COUNT(*) as audit_log_count FROM audit_logs;

COMMIT;
