@echo off
REM =====================================================
REM MADISON LUNCH REGISTRATION - DATABASE RESTORE
REM =====================================================
REM 
REM This script restores the lunch_registration database from a backup
REM 
REM Usage: restore-database.bat [backup_file]
REM Example: restore-database.bat database\backups\lunch_registration_20240531_143000.sql
REM 
REM If no backup file is specified, it will show available backups
REM =====================================================

echo =====================================================
echo MADISON LUNCH REGISTRATION - DATABASE RESTORE
echo =====================================================
echo.

REM Set password environment variable
set PGPASSWORD=Kimng@n270500

REM Check if backup file was provided
if "%~1"=="" (
    echo No backup file specified.
    echo.
    echo Available backups:
    echo.
    
    if exist "database\backups\*.sql" (
        dir /B /O-D database\backups\*.sql
        echo.
        echo Usage: restore-database.bat [backup_file]
        echo Example: restore-database.bat database\backups\lunch_registration_20240531_143000.sql
    ) else (
        echo No backup files found in database\backups\
        echo Please create a backup first using backup-database.bat
    )
    echo.
    goto :cleanup
)

REM Check if backup file exists
if not exist "%~1" (
    echo Error: Backup file not found: %~1
    echo.
    goto :cleanup
)

echo WARNING: This will replace all data in the database!
echo Backup file: %~1
echo.
set /p CONFIRM="Are you sure you want to restore? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo.
    echo Restore cancelled.
    echo.
    goto :cleanup
)

echo.
echo [1/3] Dropping existing database...
psql -U postgres -c "DROP DATABASE IF EXISTS lunch_registration;" 2>nul

echo [2/3] Creating new database...
psql -U postgres -c "CREATE DATABASE lunch_registration;"

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to create database
    echo.
    goto :cleanup
)

echo [3/3] Restoring data from backup...
psql -U postgres -d lunch_registration -f "%~1"

if %errorlevel% equ 0 (
    echo.
    echo =====================================================
    echo RESTORE SUCCESSFUL!
    echo =====================================================
    echo.
    echo Database has been restored from: %~1
    echo.
) else (
    echo.
    echo =====================================================
    echo RESTORE FAILED!
    echo =====================================================
    echo.
    echo Please check the backup file and try again.
    echo.
)

:cleanup
REM Clear password from environment
set PGPASSWORD=

pause
