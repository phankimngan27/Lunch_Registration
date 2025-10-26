@echo off
echo Starting Lunch Registration Website...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not found in PATH!
    echo.
    echo Please add Node.js to your system PATH or run this command:
    echo set PATH=C:\Program Files\nodejs;%%PATH%%
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo ERROR: Backend dependencies not installed!
    echo Please run: cd backend ^&^& npm install
    echo.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo ERROR: Frontend dependencies not installed!
    echo Please run: cd frontend ^&^& npm install
    echo.
    pause
    exit /b 1
)

REM Start Backend
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Wait 3 seconds
timeout /t 3 /nobreak > nul

REM Start Frontend
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo Website is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to open browser...
pause > nul

REM Open browser
start http://localhost:3000/login
