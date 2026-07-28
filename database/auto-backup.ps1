# Automatic Database Backup Script for Windows
# Madison Lunch Registration System
# 
# Features:
# - Daily automatic backup
# - Retention policy (keep last N backups)
# - Backup verification
# - Optional cloud upload
# - Email/Slack notifications (optional)

param(
    [int]$RetentionDays = 7,
    [switch]$UploadToCloud = $false,
    [switch]$SendNotification = $false,
    [string]$NotificationWebhook = ""
)

# ================== Configuration ==================
$BackupDir = "$PSScriptRoot\backups"
$LogFile = "$PSScriptRoot\backup.log"
$MaxBackups = $RetentionDays

# Database Configuration
$DBHost = $env:DB_HOST ?? "localhost"
$DBPort = $env:DB_PORT ?? "5432"
$DBName = $env:DB_NAME ?? "lunch_registration"
$DBUser = $env:DB_USER ?? "postgres"
$DBPassword = $env:DB_PASSWORD

# Cloud Upload Configuration (Optional)
$CloudBackupDir = "$PSScriptRoot\cloud-backups"
$UseCloudUpload = $UploadToCloud

# ================== Functions ==================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Send-Notification {
    param([string]$Message, [string]$Status = "SUCCESS")
    
    if (-not $SendNotification -or -not $NotificationWebhook) {
        return
    }

    $Color = if ($Status -eq "SUCCESS") { "good" } else { "danger" }
    $Emoji = if ($Status -eq "SUCCESS") { "✅" } else { "❌" }
    
    $Payload = @{
        text = "$Emoji Database Backup: $Status"
        attachments = @(
            @{
                color = $Color
                text = $Message
                footer = "Madison Lunch Registration System"
                ts = [int][double]::Parse((Get-Date -UFormat %s))
            }
        )
    } | ConvertTo-Json -Depth 4

    try {
        Invoke-RestMethod -Uri $NotificationWebhook -Method Post -Body $Payload -ContentType 'application/json' | Out-Null
    } catch {
        Write-Log "Failed to send notification: $_" "WARN"
    }
}

function Test-PostgreSQL {
    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        return $true
    } catch {
        Write-Log "PostgreSQL tools not found. Please install PostgreSQL or add to PATH." "ERROR"
        return $false
    }
}

function New-DatabaseBackup {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BackupDir "${DBName}_${Timestamp}.sql"
    
    Write-Log "Starting backup: $BackupFile"
    
    # Ensure backup directory exists
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-Log "Created backup directory: $BackupDir"
    }

    # Set password as environment variable
    $env:PGPASSWORD = $DBPassword

    try {
        # Create backup with pg_dump
        $DumpArgs = @(
            "-h", $DBHost,
            "-p", $DBPort,
            "-U", $DBUser,
            "-d", $DBName,
            "-f", $BackupFile,
            "--no-owner",
            "--no-acl",
            "--clean",
            "--if-exists",
            "--verbose"
        )
        
        $Process = Start-Process -FilePath "pg_dump" -ArgumentList $DumpArgs -Wait -NoNewWindow -PassThru -RedirectStandardError "$BackupFile.error.log"
        
        if ($Process.ExitCode -ne 0) {
            $ErrorContent = Get-Content "$BackupFile.error.log" -Raw
            throw "pg_dump failed with exit code $($Process.ExitCode): $ErrorContent"
        }

        # Remove error log if successful
        if (Test-Path "$BackupFile.error.log") {
            Remove-Item "$BackupFile.error.log" -Force
        }

        # Verify backup file
        if (-not (Test-Path $BackupFile)) {
            throw "Backup file was not created"
        }

        $FileSize = (Get-Item $BackupFile).Length
        if ($FileSize -lt 1KB) {
            throw "Backup file is suspiciously small (< 1KB)"
        }

        $FileSizeKB = [math]::Round($FileSize / 1KB, 2)
        Write-Log "Backup completed successfully: $FileSizeKB KB"
        
        return @{
            Success = $true
            FilePath = $BackupFile
            Size = $FileSize
        }
    } catch {
        Write-Log "Backup failed: $_" "ERROR"
        if (Test-Path $BackupFile) {
            Remove-Item $BackupFile -Force
        }
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    } finally {
        # Clear password from environment
        $env:PGPASSWORD = $null
    }
}

function Remove-OldBackups {
    Write-Log "Cleaning up old backups (keeping last $MaxBackups)..."
    
    $Backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($Backups.Count -le $MaxBackups) {
        Write-Log "No old backups to remove ($($Backups.Count) backups found)"
        return
    }

    $BackupsToRemove = $Backups | Select-Object -Skip $MaxBackups
    
    foreach ($Backup in $BackupsToRemove) {
        try {
            Remove-Item $Backup.FullName -Force
            Write-Log "Removed old backup: $($Backup.Name)"
        } catch {
            Write-Log "Failed to remove backup $($Backup.Name): $_" "WARN"
        }
    }
    
    Write-Log "Cleanup completed. Kept $MaxBackups most recent backups."
}

function Copy-ToCloud {
    param([string]$BackupFile)
    
    if (-not $UseCloudUpload) {
        return
    }

    Write-Log "Uploading backup to cloud storage..."
    
    # Ensure cloud backup directory exists
    if (-not (Test-Path $CloudBackupDir)) {
        New-Item -ItemType Directory -Path $CloudBackupDir -Force | Out-Null
    }

    try {
        # Copy to cloud backup directory (can be OneDrive, Dropbox, Google Drive sync folder)
        $CloudFile = Join-Path $CloudBackupDir (Split-Path $BackupFile -Leaf)
        Copy-Item $BackupFile $CloudFile -Force
        Write-Log "Uploaded to cloud: $CloudFile"
        
        # Optional: Compress for cloud storage
        $ZipFile = $CloudFile -replace '.sql$', '.zip'
        Compress-Archive -Path $CloudFile -DestinationPath $ZipFile -Force
        Remove-Item $CloudFile -Force
        
        $ZipSize = [math]::Round((Get-Item $ZipFile).Length / 1KB, 2)
        Write-Log "Compressed cloud backup: $ZipSize KB"
        
        return $true
    } catch {
        Write-Log "Failed to upload to cloud: $_" "ERROR"
        return $false
    }
}

function Get-BackupStatistics {
    $Backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" -ErrorAction SilentlyContinue
    
    if ($Backups.Count -eq 0) {
        return "No backups found"
    }

    $TotalSize = ($Backups | Measure-Object -Property Length -Sum).Sum
    $TotalSizeMB = [math]::Round($TotalSize / 1MB, 2)
    $Latest = $Backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    return "Total backups: $($Backups.Count) | Total size: ${TotalSizeMB} MB | Latest: $($Latest.LastWriteTime)"
}

# ================== Main Script ==================

Write-Log "========================================" 
Write-Log "Starting Automatic Database Backup"
Write-Log "Database: $DBName@$DBHost:$DBPort"
Write-Log "Retention: $RetentionDays days"
Write-Log "========================================"

# Check PostgreSQL tools
if (-not (Test-PostgreSQL)) {
    Send-Notification "PostgreSQL tools not found. Backup aborted." "FAILED"
    exit 1
}

# Create backup
$Result = New-DatabaseBackup

if ($Result.Success) {
    $SizeKB = [math]::Round($Result.Size / 1KB, 2)
    Write-Log "✅ Backup created successfully: $SizeKB KB"
    
    # Upload to cloud (if enabled)
    if ($UseCloudUpload) {
        Copy-ToCloud $Result.FilePath
    }
    
    # Cleanup old backups
    Remove-OldBackups
    
    # Get statistics
    $Stats = Get-BackupStatistics
    Write-Log "Backup statistics: $Stats"
    
    # Send success notification
    $Message = "Backup completed successfully`nFile: $(Split-Path $Result.FilePath -Leaf)`nSize: $SizeKB KB`n$Stats"
    Send-Notification $Message "SUCCESS"
    
    Write-Log "========================================" 
    Write-Log "Backup process completed successfully"
    Write-Log "========================================" 
    
    exit 0
} else {
    Write-Log "❌ Backup failed: $($Result.Error)" "ERROR"
    Send-Notification "Backup failed: $($Result.Error)" "FAILED"
    
    Write-Log "========================================" 
    Write-Log "Backup process failed"
    Write-Log "========================================" 
    
    exit 1
}
