@echo off
REM Cleanup Documentation Files
REM This script removes temporary and duplicate documentation files

echo ========================================
echo Documentation Cleanup Script
echo ========================================
echo.

echo WARNING: This will delete 13 temporary documentation files
echo.
echo Files to be deleted:
echo   - BUGFIX_CANCEL_REGISTRATION.md
echo   - BUGFIX_SUMMARY.md
echo   - BUGFIX_VEGETARIAN_DISPLAY.md
echo   - SECURITY_FIX_VEGETARIAN_VALIDATION.md
echo   - PERFORMANCE_IMPROVEMENTS.md
echo   - PERFORMANCE_README.md
echo   - QUICK_PERFORMANCE_FIX.md
echo   - TEST_PERFORMANCE.md
echo   - DEPLOYMENT_CHECKLIST.md
echo   - DEPLOYMENT_PERFORMANCE_UPGRADE.md
echo   - START_HERE.md
echo   - CODE_REVIEW_REPORT.md
echo   - QUICKSTART.md
echo.

set /p confirm="Are you sure you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cleanup cancelled.
    exit /b 0
)

echo.
echo Starting cleanup...
echo.

REM Delete bugfix docs
if exist BUGFIX_CANCEL_REGISTRATION.md (
    del BUGFIX_CANCEL_REGISTRATION.md
    echo [DELETED] BUGFIX_CANCEL_REGISTRATION.md
)

if exist BUGFIX_SUMMARY.md (
    del BUGFIX_SUMMARY.md
    echo [DELETED] BUGFIX_SUMMARY.md
)

if exist BUGFIX_VEGETARIAN_DISPLAY.md (
    del BUGFIX_VEGETARIAN_DISPLAY.md
    echo [DELETED] BUGFIX_VEGETARIAN_DISPLAY.md
)

if exist SECURITY_FIX_VEGETARIAN_VALIDATION.md (
    del SECURITY_FIX_VEGETARIAN_VALIDATION.md
    echo [DELETED] SECURITY_FIX_VEGETARIAN_VALIDATION.md
)

REM Delete duplicate performance docs
if exist PERFORMANCE_IMPROVEMENTS.md (
    del PERFORMANCE_IMPROVEMENTS.md
    echo [DELETED] PERFORMANCE_IMPROVEMENTS.md
)

if exist PERFORMANCE_README.md (
    del PERFORMANCE_README.md
    echo [DELETED] PERFORMANCE_README.md
)

if exist QUICK_PERFORMANCE_FIX.md (
    del QUICK_PERFORMANCE_FIX.md
    echo [DELETED] QUICK_PERFORMANCE_FIX.md
)

if exist TEST_PERFORMANCE.md (
    del TEST_PERFORMANCE.md
    echo [DELETED] TEST_PERFORMANCE.md
)

REM Delete duplicate deployment docs
if exist DEPLOYMENT_CHECKLIST.md (
    del DEPLOYMENT_CHECKLIST.md
    echo [DELETED] DEPLOYMENT_CHECKLIST.md
)

if exist DEPLOYMENT_PERFORMANCE_UPGRADE.md (
    del DEPLOYMENT_PERFORMANCE_UPGRADE.md
    echo [DELETED] DEPLOYMENT_PERFORMANCE_UPGRADE.md
)

REM Delete redundant docs
if exist START_HERE.md (
    del START_HERE.md
    echo [DELETED] START_HERE.md
)

if exist CODE_REVIEW_REPORT.md (
    del CODE_REVIEW_REPORT.md
    echo [DELETED] CODE_REVIEW_REPORT.md
)

if exist QUICKSTART.md (
    del QUICKSTART.md
    echo [DELETED] QUICKSTART.md
)

REM Delete cleanup plan itself
if exist CLEANUP_PLAN.md (
    del CLEANUP_PLAN.md
    echo [DELETED] CLEANUP_PLAN.md
)

echo.
echo ========================================
echo Cleanup completed successfully!
echo ========================================
echo.
echo Remaining documentation files:
echo   - README.md
echo   - DEPLOYMENT_GUIDE.md
echo   - SECURITY_GUIDE.md
echo   - TECH_STACK.md
echo   - BEST_PRACTICES.md
echo   - CONTRIBUTING.md
echo   - DATA_CLEANUP_GUIDE.md
echo   - PERFORMANCE_SUMMARY.md
echo.
echo Next steps:
echo   1. Review remaining files
echo   2. Commit changes: git commit -am "chore: cleanup documentation files"
echo   3. Delete this script: del cleanup-docs.bat
echo.

pause
