# 🛡️ Madison Lunch Registration - Backup System Guide

**Complete guide for automatic backup system**

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#-quick-start-5-minutes)
2. [Overview](#-overview)
3. [Setup Instructions](#-setup-instructions)
4. [Daily Operations](#-daily-operations)
5. [Architecture](#-architecture)
6. [Configuration](#-configuration)
7. [Monitoring & Maintenance](#-monitoring--maintenance)
8. [Recovery Procedures](#-recovery-procedures)
9. [Troubleshooting](#-troubleshooting)
10. [Best Practices](#-best-practices)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Setup Daily Automatic Backup
```powershell
# Mở PowerShell với quyền Administrator
cd database
.\setup-auto-backup.ps1
```

### Step 2: Verify Setup
```powershell
# Check task created
Get-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# Check backup file
Get-ChildItem backups\*.sql | Select-Object -Last 1

# Check log
Get-Content backup.log -Tail 10
```

### ✅ Done!
- Backend already configured (`.env` has `AUTO_BACKUP_ENABLED=true`)
- System will backup automatically every day at 2:00 AM
- Pre-operation backups enabled for dangerous operations

---

## 📊 Overview

### 3-Tier Protection System

| Tier | Type | Frequency | Purpose |
|------|------|-----------|---------|
| 1️⃣ | Daily Auto | Every day 2AM | Regular checkpoints |
| 2️⃣ | Pre-Operation | Before dangerous ops | Operation safety |
| 3️⃣ | Manual | On-demand | Custom backups |

### What's Protected

✅ **Automatic Daily Backup**
- Runs every day at 2:00 AM
- Keeps last 7 backups
- Auto-cleanup old files
- Optional cloud upload
- Optional Slack notifications

✅ **Pre-Operation Backup**
- Before bulk delete registrations
- Before bulk update registrations
- Before user imports
- Can block operations if backup fails

✅ **Manual Backup**
- Command: `.\auto-backup.ps1`
- Full control over retention
- Custom naming support

---

## ⚙️ Setup Instructions

### Prerequisites
- Windows 10/11 or Windows Server
- PostgreSQL 14+ installed
- PowerShell 5.1+
- Administrator privileges

### Initial Setup

#### 1. Setup Automatic Daily Backup

```powershell
# Navigate to database folder
cd "C:\path\to\lunch-registration\database"

# Run setup script (as Administrator)
.\setup-auto-backup.ps1
```

**Options:**
```powershell
# Custom time and retention
.\setup-auto-backup.ps1 -Time "03:00" -RetentionDays 14

# Enable cloud upload
.\setup-auto-backup.ps1 -UploadToCloud

# Full setup with all options
.\setup-auto-backup.ps1 `
    -Time "02:00" `
    -RetentionDays 7 `
    -UploadToCloud
```

#### 2. Verify Task Created

```powershell
# View task details
Get-ScheduledTask -TaskName "LunchRegistration-DailyBackup" | Format-List

# Run test backup now
Start-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# Wait a moment, then check log
Start-Sleep -Seconds 5
Get-Content database\backup.log -Tail 20
```

#### 3. Enable Pre-Operation Backup

Already enabled! Backend `.env` has:
```bash
AUTO_BACKUP_ENABLED=true
```

If you need to change it:
```bash
# Edit backend/.env
AUTO_BACKUP_ENABLED=true  # or false to disable

# Restart backend
cd backend
pm2 restart lunch-backend
```

---

## 📅 Daily Operations

### Normal Day: Do Nothing!
System runs automatically. No manual intervention needed.

### Optional Monitoring (Once per week):

```powershell
# Check latest backup
Get-ChildItem database\backups\*.sql | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

# Check logs
Get-Content database\backup.log -Tail 30

# Quick health check
$Latest = Get-ChildItem database\backups\*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$Hours = ((Get-Date) - $Latest.LastWriteTime).TotalHours
Write-Host "Latest backup: $([math]::Round($Hours,1)) hours ago"
if ($Hours -gt 25) { Write-Host "⚠️  WARNING: No backup in 24 hours!" -ForegroundColor Red }
```

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────┐
│           DATABASE (PostgreSQL)              │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
  ┌──────────┐ ┌────────┐ ┌────────┐
  │ Daily    │ │ Pre-Op │ │ Manual │
  │ Backup   │ │ Backup │ │ Backup │
  └────┬─────┘ └───┬────┘ └───┬────┘
       │           │           │
       └───────────┼───────────┘
                   │
              ┌────▼────┐
              │ pg_dump │
              └────┬────┘
                   │
            ┌──────▼──────┐
            │ Backup Files│
            │ (.sql)      │
            └─────────────┘
```

### Data Flow

**Daily Backup Flow:**
```
2:00 AM → Task Scheduler → auto-backup.ps1 → pg_dump → 
→ Verify → Cleanup Old → Log → Optional: Cloud Upload
```

**Pre-Operation Backup Flow:**
```
Admin Action → API Request → Auth Middleware → 
→ Backup Hook → Create Backup → Verify → 
→ Continue or Abort Operation
```

### File Locations

```
database/
├── backups/                                    ← Backup storage
│   ├── lunch_registration_20260728_020000.sql
│   ├── pre_BULK_DELETE_timestamp.sql
│   └── ...
├── auto-backup.ps1                            ← Main script
├── setup-auto-backup.ps1                      ← Setup script
├── backup-database.bat                        ← Legacy script
├── restore-database.bat                       ← Restore script
└── backup.log                                 ← Activity log
```

---

## ⚙️ Configuration

### Environment Variables

**Backend `.env`:**
```bash
# Enable/disable pre-operation backups
AUTO_BACKUP_ENABLED=true

# Database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lunch_registration
DB_USER=postgres
DB_PASSWORD=your_password
```

### Task Scheduler Configuration

```powershell
# View current configuration
Get-ScheduledTask -TaskName "LunchRegistration-DailyBackup" | Format-List

# Modify backup time
.\setup-auto-backup.ps1 -Time "03:00"

# Modify retention period
.\setup-auto-backup.ps1 -RetentionDays 14

# Re-create task with new settings
.\setup-auto-backup.ps1 -Time "02:00" -RetentionDays 7
```

### Backup Script Parameters

**`auto-backup.ps1` parameters:**
```powershell
# Retention days (default: 7)
.\auto-backup.ps1 -RetentionDays 14

# Enable cloud upload
.\auto-backup.ps1 -UploadToCloud

# Enable Slack notifications
.\auto-backup.ps1 `
    -SendNotification `
    -NotificationWebhook "https://hooks.slack.com/..."

# All options combined
.\auto-backup.ps1 `
    -RetentionDays 14 `
    -UploadToCloud `
    -SendNotification `
    -NotificationWebhook "https://hooks.slack.com/..."
```

### Cloud Upload Setup (Optional)

**1. Setup OneDrive/Google Drive folder:**
```powershell
# Create cloud folder
$CloudDir = "C:\Users\YourName\OneDrive\LunchBackups"
New-Item -ItemType Directory -Path $CloudDir -Force

# Create symlink
New-Item -ItemType SymbolicLink `
    -Path "database\cloud-backups" `
    -Target $CloudDir
```

**2. Enable in setup:**
```powershell
.\setup-auto-backup.ps1 -UploadToCloud
```

### Slack Notifications Setup (Optional)

**1. Get Slack Webhook URL:**
- Go to https://api.slack.com/messaging/webhooks
- Create new webhook
- Copy webhook URL

**2. Configure:**
```powershell
# Test notification
$Webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
$Body = @{ text = "Test backup notification" } | ConvertTo-Json
Invoke-RestMethod -Uri $Webhook -Method Post -Body $Body -ContentType 'application/json'

# Add to setup
.\setup-auto-backup.ps1 -NotificationWebhook $Webhook
```

---

## 📊 Monitoring & Maintenance

### Daily Monitoring (1 minute)

```powershell
# Quick health check
$Latest = Get-ChildItem database\backups\*.sql | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

$Hours = ((Get-Date) - $Latest.LastWriteTime).TotalHours
Write-Host "Latest backup: $([math]::Round($Hours,1)) hours ago"

if ($Hours -gt 25) {
    Write-Host "⚠️  WARNING: No backup in 24 hours!" -ForegroundColor Red
} else {
    Write-Host "✅ Backup system healthy" -ForegroundColor Green
}
```

### Weekly Monitoring (5 minutes)

```powershell
# 1. List all backups
Get-ChildItem database\backups\*.sql | 
    Select-Object Name, 
        @{N="Size(MB)";E={[math]::Round($_.Length/1MB,2)}}, 
        @{N="Age(Days)";E={((Get-Date) - $_.LastWriteTime).Days}},
        LastWriteTime | 
    Sort-Object LastWriteTime -Descending | 
    Format-Table -AutoSize

# 2. Check backup logs for errors
Select-String -Path database\backup.log -Pattern "ERROR" | 
    Select-Object -Last 10

# 3. Test restore (to test database)
$env:PGPASSWORD="your_password"
psql -U postgres -c "CREATE DATABASE lunch_test;"
$TestBackup = Get-ChildItem database\backups\*.sql | Get-Random
psql -U postgres -d lunch_test -f $TestBackup.FullName
psql -U postgres -c "SELECT COUNT(*) FROM users;" -d lunch_test
psql -U postgres -c "DROP DATABASE lunch_test;"
```

### Monthly Monitoring (15 minutes)

```powershell
# Full backup audit
Get-ChildItem database\backups\*.sql | 
    Measure-Object -Property Length -Sum -Average -Maximum | 
    Format-List

# Cleanup old backups (>30 days)
Get-ChildItem database\backups\*.sql | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item -Verbose

# Archive important backups
# (Copy to external drive or cloud storage)
```

### Backup Statistics

```powershell
# Get backup statistics
$Backups = Get-ChildItem database\backups\*.sql
$TotalSize = ($Backups | Measure-Object -Property Length -Sum).Sum
$TotalSizeMB = [math]::Round($TotalSize / 1MB, 2)
$Latest = $Backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Write-Host "Backup Statistics:" -ForegroundColor Cyan
Write-Host "  Total backups: $($Backups.Count)"
Write-Host "  Total size: ${TotalSizeMB} MB"
Write-Host "  Latest: $($Latest.LastWriteTime)"
Write-Host "  Average size: $([math]::Round($TotalSizeMB / $Backups.Count, 2)) MB"
```

---

## 🔙 Recovery Procedures

### Quick Restore (Last Backup)

```powershell
cd database

# 1. Stop application
pm2 stop lunch-backend

# 2. List available backups
Get-ChildItem backups\*.sql | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 Name, LastWriteTime

# 3. Restore
.\restore-database.bat backups\lunch_registration_LATEST.sql

# 4. Restart application
pm2 start lunch-backend

# 5. Verify
# Open application and check data
```

### Restore from Specific Backup

```powershell
# Find specific backup
Get-ChildItem backups\*.sql | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } |
    Sort-Object LastWriteTime -Descending

# Restore
.\restore-database.bat backups\lunch_registration_20260721_020000.sql
```

### Restore Pre-Operation Backup

```powershell
# Find pre-operation backups
Get-ChildItem backups\pre_*.sql | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 10

# Restore specific pre-op backup
.\restore-database.bat backups\pre_BULK_DELETE_2026-07-28T14-30-00.sql
```

### Emergency Recovery

**Scenario: Complete Data Loss**

```powershell
# 1. STOP application immediately
pm2 stop lunch-backend

# 2. Backup current state (even if corrupt)
.\auto-backup.ps1

# 3. List all available backups
Get-ChildItem backups\*.sql | 
    Sort-Object LastWriteTime -Descending

# 4. Choose last known good backup
.\restore-database.bat backups\lunch_registration_GOOD_BACKUP.sql

# 5. Verify database
$env:PGPASSWORD="your_password"
psql -U postgres -d lunch_registration -c "\dt"
psql -U postgres -d lunch_registration -c "SELECT COUNT(*) FROM users;"
psql -U postgres -d lunch_registration -c "SELECT COUNT(*) FROM registrations;"

# 6. Restart application
pm2 start lunch-backend

# 7. Test functionality
# - Login
# - View registrations
# - Create test registration
# - Delete test registration

# 8. Monitor logs
pm2 logs lunch-backend
```

---

## 🔧 Troubleshooting

### Problem: Task không chạy

**Symptoms:** No new backups after 24 hours

**Diagnosis:**
```powershell
# Check task status
Get-ScheduledTask -TaskName "LunchRegistration-DailyBackup" | 
    Select-Object TaskName, State, LastRunTime, LastTaskResult

# Check task history
Get-ScheduledTaskInfo -TaskName "LunchRegistration-DailyBackup"
```

**Solutions:**
```powershell
# 1. Enable task if disabled
Enable-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# 2. Run manually to see errors
Start-ScheduledTask -TaskName "LunchRegistration-DailyBackup"
Start-Sleep -Seconds 5
Get-Content database\backup.log -Tail 30

# 3. Re-create task
.\setup-auto-backup.ps1
```

### Problem: pg_dump not found

**Symptoms:** Error "pg_dump: command not found"

**Solution:**
```powershell
# Find PostgreSQL installation
$PgPath = "C:\Program Files\PostgreSQL\18\bin"

# Check if exists
if (Test-Path $PgPath) {
    # Add to PATH permanently
    $env:Path += ";$PgPath"
    [Environment]::SetEnvironmentVariable(
        "Path", 
        $env:Path, 
        "Machine"
    )
    Write-Host "✅ Added PostgreSQL to PATH" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL." -ForegroundColor Red
}

# Verify
Get-Command pg_dump
```

### Problem: Backup file empty or too small

**Symptoms:** Backup file < 10KB

**Diagnosis:**
```powershell
# Check latest backup size
$Latest = Get-ChildItem database\backups\*.sql | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1
Write-Host "Latest backup: $($Latest.Name) - $([math]::Round($Latest.Length/1KB,2)) KB"

# Check logs
Get-Content database\backup.log -Tail 50 | 
    Select-String -Pattern "ERROR|WARN"
```

**Solutions:**
```powershell
# 1. Test database connection
$env:PGPASSWORD="your_password"
psql -U postgres -d lunch_registration -c "SELECT COUNT(*) FROM users;"

# 2. Check disk space
Get-PSDrive C | Select-Object Used, Free, 
    @{N="Free(GB)";E={[math]::Round($_.Free/1GB,2)}}

# 3. Test pg_dump manually
cd database
pg_dump -U postgres -d lunch_registration -f test_backup.sql --verbose

# 4. Check password in script
# Edit auto-backup.ps1 and verify DB_PASSWORD
```

### Problem: Pre-operation backup blocking operations

**Symptoms:** Bulk operations failing with "Backup failed" error

**Temporary Solution:**
```bash
# Disable pre-operation backup in .env
AUTO_BACKUP_ENABLED=false

# Restart backend
pm2 restart lunch-backend
```

**Permanent Solution:**
```typescript
// Change to non-blocking mode in routes/index.ts
applyBackupHook('BULK_DELETE', false)  // false = non-blocking
```

### Problem: Restore fails

**Symptoms:** Error during restore

**Diagnosis:**
```powershell
# Check backup file integrity
$BackupFile = "backups\lunch_registration_20260728.sql"

# Check size
(Get-Item $BackupFile).Length

# Check first few lines
Get-Content $BackupFile -First 10

# Look for "PostgreSQL" header
Select-String -Path $BackupFile -Pattern "PostgreSQL" -List
```

**Solutions:**
```powershell
# 1. Try different backup
.\restore-database.bat backups\lunch_registration_DIFFERENT.sql

# 2. Manual restore
$env:PGPASSWORD="your_password"
psql -U postgres -d lunch_registration -f $BackupFile

# 3. Restore to new database (safe)
psql -U postgres -c "CREATE DATABASE lunch_restoration;"
psql -U postgres -d lunch_restoration -f $BackupFile
# If successful, rename databases
```

---

## ✅ Best Practices

### DO:

✅ **Test restore monthly**
```powershell
# Monthly restore test
$env:PGPASSWORD="your_password"
psql -U postgres -c "CREATE DATABASE lunch_test;"
$TestBackup = Get-ChildItem database\backups\*.sql | Get-Random
psql -U postgres -d lunch_test -f $TestBackup.FullName
psql -U postgres -c "DROP DATABASE lunch_test;"
```

✅ **Keep backups off-site**
- Setup cloud upload to OneDrive/Google Drive
- Copy important backups to external drive monthly

✅ **Monitor backup logs**
```powershell
# Weekly log check
Get-Content database\backup.log | 
    Select-String -Pattern "ERROR|WARN" | 
    Select-Object -Last 20
```

✅ **Document important backups**
```powershell
# Rename critical backups
Rename-Item `
    backups\lunch_registration_20260728.sql `
    -NewName "lunch_registration_20260728_before_v2_migration.sql"
```

✅ **Verify backup integrity**
```powershell
# Check all backups
Get-ChildItem database\backups\*.sql | ForEach-Object {
    if ($_.Length -lt 10KB) {
        Write-Host "⚠️  Suspicious: $($_.Name) - $([math]::Round($_.Length/1KB,2)) KB" -ForegroundColor Yellow
    }
}
```

### DON'T:

❌ **Never commit backups to Git**
- Backups are already in `.gitignore`
- Too large for version control
- May contain sensitive data

❌ **Never delete all backups at once**
```powershell
# BAD - Don't do this!
Remove-Item database\backups\*.sql

# GOOD - Keep at least last 3
Get-ChildItem database\backups\*.sql | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip 3 | 
    Remove-Item
```

❌ **Never test restore on production first**
```powershell
# ALWAYS test on local/staging first
# Create test database
psql -U postgres -c "CREATE DATABASE lunch_test;"
psql -U postgres -d lunch_test -f backup.sql
# Test, then apply to production
```

❌ **Never ignore backup errors**
```powershell
# Check logs regularly
Get-Content database\backup.log | 
    Select-String -Pattern "ERROR"

# If errors found, investigate immediately
```

❌ **Never hardcode credentials**
```powershell
# BAD
$DBPassword = "mypassword123"

# GOOD  
$DBPassword = $env:DB_PASSWORD
```

---

## 📚 Additional Resources

### Scripts Reference

- **`setup-auto-backup.ps1`** - One-time setup for Task Scheduler
- **`auto-backup.ps1`** - Main backup execution script
- **`backup-database.bat`** - Legacy manual backup
- **`restore-database.bat`** - Restore from backup

### Related Documentation

- **Main README:** `README.md` - Project overview
- **Deployment Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md` - Production setup
- **Tech Stack:** `TECH_STACK.md` - Technology details
- **Security Guide:** `SECURITY_README.md` - Security best practices

### External Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Windows Task Scheduler Documentation](https://learn.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page)

---

## 📞 Support & Help

### Common Commands Reference

```powershell
# View task status
Get-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# Run backup now
Start-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# View logs
Get-Content database\backup.log -Tail 50

# List backups
Get-ChildItem database\backups\*.sql | Sort-Object LastWriteTime -Descending

# Disable task
Disable-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# Enable task
Enable-ScheduledTask -TaskName "LunchRegistration-DailyBackup"

# Remove task
Unregister-ScheduledTask -TaskName "LunchRegistration-DailyBackup"
```

### Getting Help

1. Check this guide's Troubleshooting section
2. Review backup logs: `database\backup.log`
3. Check Task Scheduler event history
4. Verify PostgreSQL is running: `psql -U postgres -l`

---

## 📋 Maintenance Checklist

### Daily (Automated)
- [x] Backup runs at 2:00 AM automatically
- [x] Old backups cleaned up automatically

### Weekly (1 minute)
- [ ] Check backup logs for errors
- [ ] Verify latest backup exists and size is reasonable

### Monthly (15 minutes)
- [ ] Test restore to test database
- [ ] Review backup statistics
- [ ] Clean up backups older than 30 days
- [ ] Archive important backups to external storage

### Quarterly (30 minutes)
- [ ] Full restore test on staging environment
- [ ] Review and update backup retention policy
- [ ] Test recovery procedures with team
- [ ] Update documentation if procedures changed

---

**Version:** 1.0.0  
**Last Updated:** July 28, 2026  
**Maintained by:** Madison Technologies Team

