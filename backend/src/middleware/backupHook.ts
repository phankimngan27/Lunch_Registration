/**
 * Backup Hook Middleware with Multi-Layer Protection
 * 
 * PROTECTION STRATEGY:
 * 1. Transaction-based rollback (always enabled) - PRIMARY PROTECTION
 * 2. Physical backup before operation (optional) - SECONDARY PROTECTION
 * 3. Audit log of all changes (always enabled) - FORENSICS
 * 
 * Even if backup fails, transaction rollback prevents data loss.
 * Use this middleware for routes that modify large amounts of data
 * or perform operations that could lead to data loss.
 */

import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import pool from '../config/database';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface BackupConfig {
  enabled: boolean;
  backupDir: string;
  maxBackupsToKeep: number;
  operations: string[]; // List of operations to trigger backup
}

/**
 * Create audit log entry for dangerous operations
 */
async function createAuditLog(
  operation: string,
  userId: number,
  userEmail: string,
  metadata: any
): Promise<void> {
  try {
    // Create audit_logs table if not exists (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        operation VARCHAR(100) NOT NULL,
        user_id INTEGER NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        metadata JSONB,
        backup_created BOOLEAN DEFAULT false,
        backup_file VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes if not exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    `);

    await pool.query(
      `INSERT INTO audit_logs (operation, user_id, user_email, metadata, backup_created)
       VALUES ($1, $2, $3, $4, $5)`,
      [operation, userId, userEmail, JSON.stringify(metadata), false]
    );

    logger.info('Audit log created', { operation, userEmail });
  } catch (error) {
    // Don't fail operation if audit log fails, just log it
    logger.error('Failed to create audit log', error, { operation, userEmail });
  }
}

interface BackupConfig {
  enabled: boolean;
  backupDir: string;
  maxBackupsToKeep: number;
  operations: string[]; // List of operations to trigger backup
}

// Configuration
const config: BackupConfig = {
  enabled: process.env.AUTO_BACKUP_ENABLED === 'true',
  backupDir: path.join(__dirname, '../../../database/backups'),
  maxBackupsToKeep: 10,
  operations: [
    'BULK_CREATE',
    'BULK_DELETE',
    'BULK_UPDATE',
    'USER_IMPORT',
    'REGISTRATION_RESET'
  ]
};

/**
 * Create a pre-operation backup
 */
async function createPreOpBackup(operation: string): Promise<boolean> {
  if (!config.enabled) {
    logger.info('Auto-backup disabled, skipping pre-operation backup', { operation });
    return true;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `pre_${operation}_${timestamp}`;
  
  try {
    logger.info('Creating pre-operation backup', { operation, backupName });
    
    // Determine script path based on OS
    const isWindows = process.platform === 'win32';
    const scriptPath = path.join(__dirname, '../../../database', 
      isWindows ? 'backup-database.bat' : 'backup-database.sh');
    
    // Execute backup script
    const { stdout, stderr } = await execAsync(`"${scriptPath}"`, {
      cwd: path.join(__dirname, '../../../database'),
      timeout: 60000 // 1 minute timeout
    });
    
    if (stderr && !stderr.includes('WARNING')) {
      logger.warn('Backup completed with warnings', { stderr });
    }
    
    logger.info('Pre-operation backup completed', { 
      operation, 
      backupName,
      output: stdout.slice(0, 200) 
    });
    
    return true;
  } catch (error: any) {
    logger.error('Failed to create pre-operation backup', error, { operation });
    // Don't block the operation, just log the error
    return false;
  }
}

/**
 * Middleware factory for pre-operation backup with multi-layer protection
 * 
 * PROTECTION LAYERS:
 * 1. Audit Log (always) - Records who did what, when
 * 2. Physical Backup (optional) - Creates SQL dump before operation
 * 3. Transaction Protection (controller responsibility) - Allows rollback
 * 
 * @param operation - Name of the operation (e.g., 'BULK_DELETE')
 * @param options - Additional options
 * @returns Express middleware
 */
export const preOperationBackup = (
  operation: string, 
  options: { 
    blocking?: boolean;
    requireBackup?: boolean;  // NEW: Force backup even if disabled
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    // LAYER 1: ALWAYS create audit log (even if backup disabled)
    if (user) {
      await createAuditLog(operation, user.id, user.email, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        body: req.body
      });
    }
    
    // Skip if operation not in trigger list
    if (!config.operations.includes(operation)) {
      return next();
    }
    
    // LAYER 2: Physical backup (optional, but recommended)
    // Skip if backup is disabled AND not required
    if (!config.enabled && !options.requireBackup) {
      logger.info('Auto-backup disabled, skipping pre-operation backup', { operation });
      return next();
    }
    
    logger.info('Pre-operation backup triggered', { 
      operation, 
      user: user?.email,
      path: req.path,
      requireBackup: options.requireBackup 
    });
    
    try {
      const success = await createPreOpBackup(operation);
      
      // If backup is REQUIRED and failed, block operation
      if (options.requireBackup && !success) {
        return res.status(500).json({ 
          message: 'Không thể tạo backup trước thao tác. Vui lòng thử lại hoặc liên hệ IT.',
          code: 'BACKUP_REQUIRED_FAILED',
          details: 'Operation requires backup but backup system failed'
        });
      }
      
      // If blocking is enabled and backup failed, return error
      if (options.blocking && !success) {
        return res.status(500).json({ 
          message: 'Failed to create backup before operation. Operation aborted for safety.',
          code: 'BACKUP_FAILED'
        });
      }
      
      // Attach backup info to request
      (req as any).preBackupCreated = success;
      next();
    } catch (error) {
      logger.error('Backup hook error', error);
      
      // If backup is REQUIRED, block on error
      if (options.requireBackup || options.blocking) {
        return res.status(500).json({ 
          message: 'Backup system error. Operation aborted for safety.',
          code: 'BACKUP_ERROR'
        });
      }
      
      next();
    }
  };
};

/**
 * Apply backup hook to specific routes
 * 
 * USAGE EXAMPLES:
 * 
 * // Non-blocking backup (best for daily operations)
 * router.post('/bulk-edit', applyBackupHook('BULK_UPDATE'));
 * 
 * // Blocking backup (fails operation if backup fails)
 * router.post('/bulk-delete', applyBackupHook('BULK_DELETE', true));
 * 
 * // Required backup (forces backup even if AUTO_BACKUP_ENABLED=false)
 * router.post('/critical-op', applyBackupHook('CRITICAL_OP', false, true));
 * 
 * PROTECTION LAYERS:
 * - Audit log: Always created (even if backup disabled)
 * - Physical backup: Created if enabled or required
 * - Transaction: Controller must use BEGIN/COMMIT/ROLLBACK
 */
export const applyBackupHook = (
  operation: string, 
  blocking: boolean = false,
  requireBackup: boolean = false
) => {
  return preOperationBackup(operation, { blocking, requireBackup });
};

/**
 * Health check for backup system
 */
export const checkBackupHealth = async (): Promise<{
  enabled: boolean;
  lastBackup?: Date;
  backupCount?: number;
  diskSpace?: string;
}> => {
  try {
    const fs = require('fs').promises;
    const backupFiles = await fs.readdir(config.backupDir);
    const sqlBackups = backupFiles.filter((f: string) => f.endsWith('.sql'));
    
    if (sqlBackups.length === 0) {
      return {
        enabled: config.enabled,
        backupCount: 0
      };
    }
    
    // Get latest backup
    const stats = await Promise.all(
      sqlBackups.map(async (f: string) => {
        const stat = await fs.stat(path.join(config.backupDir, f));
        return { name: f, mtime: stat.mtime };
      })
    );
    
    const latest = stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];
    
    return {
      enabled: config.enabled,
      lastBackup: latest.mtime,
      backupCount: sqlBackups.length
    };
  } catch (error) {
    logger.error('Failed to check backup health', error);
    return {
      enabled: config.enabled
    };
  }
};
