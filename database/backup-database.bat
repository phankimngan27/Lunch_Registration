@echo off
REM =====================================================
REM MADISON LUNCH REGISTRATION - DATABASE BACKUP
REM =====================================================
REM 
REM This script creates a backup of the lunch_registration database
REM Backup files are saved in database/backups/ folder
REM 
REM Usage: backup-database.bat
REM =====================================================

echo =====================================================
echo MADISON LUNCH REGISTRATION - DATABASE BACKUP
echo =====================================================
echo.

REM Set password environment variable
set PGPASSWORD=Kimng@n270500

REM Create backups directory if it doesn't exist
if not exist "database\backups" mkdir "database\backups"

REM Generate timestamp for backup filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Set backup filename
set BACKUP_FILE=database\backups\lunch_registration_%TIMESTAMP%.sql

echo Creating backup...
echo Backup file: %BACKUP_FILE%
echo.

REM Create backup using pg_dump
pg_dump -U postgres -d lunch_registration -F p -f %BACKUP_FILE%

if %errorlevel% equ 0 (
    echo.
    echo =====================================================
    echo BACKUP SUCCESSFUL!
    echo =====================================================
    echo.
    echo Backup saved to: %BACKUP_FILE%
    
    REM Get file size
    for %%A in (%BACKUP_FILE%) do set FILESIZE=%%~zA
    echo File size: %FILESIZE% bytes
    echo.
    
    REM List recent backups
    echo Recent backups:
    dir /B /O-D database\backups\*.sql | findstr /N "^" | findstr "^[1-5]:"
    echo.
) else (
    echo.
    echo =====================================================
    echo BACKUP FAILED!
    echo =====================================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database 'lunch_registration' exists
    echo 3. Password is correct
    echo.
)

REM Clear password from environment
set PGPASSWORD=

pause
