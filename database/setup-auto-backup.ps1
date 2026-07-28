# Setup Automatic Backup for Windows Task Scheduler
# Madison Lunch Registration System
#
# This script creates a Windows Task Scheduler task to run backups automatically

param(
    [string]$Time = "02:00",
    [int]$RetentionDays = 7,
    [switch]$UploadToCloud = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Madison Lunch Registration System" -ForegroundColor Cyan
Write-Host "Automatic Backup Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $IsAdmin) {
    Write-Host "❌ This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

$TaskName = "LunchRegistration-DailyBackup"
$ScriptPath = Join-Path $PSScriptRoot "auto-backup.ps1"
$LogPath = Join-Path $PSScriptRoot "backup.log"

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  Task Name: $TaskName"
Write-Host "  Backup Time: $Time daily"
Write-Host "  Retention: $RetentionDays days"
Write-Host "  Cloud Upload: $(if ($UploadToCloud) { 'Enabled' } else { 'Disabled' })"
Write-Host "  Script: $ScriptPath"
Write-Host "  Log: $LogPath"
Write-Host ""

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Task '$TaskName' already exists." -ForegroundColor Yellow
    $Response = Read-Host "Do you want to recreate it? (Y/N)"
    
    if ($Response -ne "Y" -and $Response -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task." -ForegroundColor Yellow
}

# Create task action
$ActionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -RetentionDays $RetentionDays"
if ($UploadToCloud) {
    $ActionArgs += " -UploadToCloud"
}

$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $ActionArgs

# Create task trigger (daily at specified time)
$Trigger = New-ScheduledTaskTrigger -Daily -At $Time

# Create task settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# Create task principal (run with highest privileges)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Automatic daily backup for Madison Lunch Registration database" | Out-Null
    
    Write-Host ""
    Write-Host "✅ Automatic backup task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  - Runs daily at $Time"
    Write-Host "  - Keeps last $RetentionDays backups"
    Write-Host "  - Logs to: $LogPath"
    Write-Host ""
    Write-Host "Management Commands:" -ForegroundColor Cyan
    Write-Host "  View task:    Get-ScheduledTask -TaskName '$TaskName'"
    Write-Host "  Run now:      Start-ScheduledTask -TaskName '$TaskName'"
    Write-Host "  View logs:    Get-Content '$LogPath' -Tail 50"
    Write-Host "  Disable:      Disable-ScheduledTask -TaskName '$TaskName'"
    Write-Host "  Enable:       Enable-ScheduledTask -TaskName '$TaskName'"
    Write-Host "  Remove:       Unregister-ScheduledTask -TaskName '$TaskName'"
    Write-Host ""
    
    # Ask if user wants to run a test backup now
    Write-Host "Would you like to run a test backup now? (Y/N): " -NoNewline -ForegroundColor Yellow
    $TestRun = Read-Host
    
    if ($TestRun -eq "Y" -or $TestRun -eq "y") {
        Write-Host ""
        Write-Host "Running test backup..." -ForegroundColor Cyan
        Start-ScheduledTask -TaskName $TaskName
        Start-Sleep -Seconds 2
        
        Write-Host "Check the log file for results:" -ForegroundColor Cyan
        Write-Host "  $LogPath" -ForegroundColor White
        Write-Host ""
        
        # Show last few lines of log
        if (Test-Path $LogPath) {
            Write-Host "Last 10 log lines:" -ForegroundColor Cyan
            Get-Content $LogPath -Tail 10 | ForEach-Object { Write-Host "  $_" }
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    exit 1
}
