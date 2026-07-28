/**
 * Backup Hook Middleware
 * Automatically creates database backups before critical operations
 * 
 * Use this middleware for routes that modify large amounts of data
 * or perform operations that could lead to data loss
 */

import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

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
 * Middleware factory for pre-operation backup
 * 
 * @param operation - Name of the operation (e.g., 'BULK_DELETE')
 * @param options - Additional options
 * @returns Express middleware
 */
export const preOperationBackup = (
  operation: string, 
  options: { blocking?: boolean } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if operation not in trigger list
    if (!config.operations.includes(operation)) {
      return next();
    }
    
    logger.info('Pre-operation backup triggered', { 
      operation, 
      user: (req as any).user?.email,
      path: req.path 
    });
    
    try {
      const success = await createPreOpBackup(operation);
      
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
      
      if (options.blocking) {
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
 * Usage in routes:
 * router.post('/registrations/bulk-cancel', 
 *   authenticate, 
 *   isAdmin, 
 *   applyBackupHook('BULK_DELETE'),
 *   cancelBulkRegistration
 * );
 */
export const applyBackupHook = (operation: string, blocking: boolean = false) => {
  return preOperationBackup(operation, { blocking });
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
