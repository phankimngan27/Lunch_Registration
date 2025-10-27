# Restart Backend Server
Write-Host "🔄 Restarting backend server..." -ForegroundColor Green
Write-Host ""

# Stop all node processes
Write-Host "1. Stopping all node processes..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ Stopped $($nodeProcesses.Count) node process(es)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "ℹ️  No node processes running" -ForegroundColor Cyan
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  Error stopping processes: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Build TypeScript
Write-Host "2. Building TypeScript..." -ForegroundColor Yellow
try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Start server in background
Write-Host "3. Starting server..." -ForegroundColor Yellow
Write-Host "ℹ️  Server will start in a new window" -ForegroundColor Cyan
Write-Host "ℹ️  Close that window to stop the server" -ForegroundColor Cyan
Write-Host ""

try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    Start-Sleep -Seconds 3
    
    # Test if server is running
    Write-Host "4. Testing server..." -ForegroundColor Yellow
    $maxRetries = 5
    $retryCount = 0
    $serverRunning = $false
    
    while ($retryCount -lt $maxRetries -and -not $serverRunning) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 2
            if ($response.status -eq "OK") {
                $serverRunning = $true
                Write-Host "✅ Server is running!" -ForegroundColor Green
                Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
                Write-Host "   Message: $($response.message)" -ForegroundColor Cyan
            }
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "   Waiting for server... (attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    }
    
    if (-not $serverRunning) {
        Write-Host "⚠️  Server may not be running. Check the server window for errors." -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Server restart completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - Check the server window for any errors" -ForegroundColor White
Write-Host "   - Test the API: .\test-toggle-status.ps1" -ForegroundColor White
Write-Host "   - Access: http://localhost:5000" -ForegroundColor White
Write-Host ""
