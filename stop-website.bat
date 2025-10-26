@echo off
echo Stopping Lunch Registration Website...

REM Kill node processes
taskkill /F /IM node.exe /T 2>nul

echo.
echo Website stopped!
pause
