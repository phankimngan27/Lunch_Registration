# Test toggle-status endpoint
Write-Host "🧪 Testing toggle-status endpoint..." -ForegroundColor Green
Write-Host ""

# Login first to get token
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@madison.dev"
        password = "admin1234"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get all users
Write-Host "2. Getting all users..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $users = Invoke-RestMethod -Uri "http://localhost:5000/api/users" -Method Get -Headers $headers
    Write-Host "✅ Retrieved $($users.Count) users" -ForegroundColor Green
    
    # Find a non-admin user to test
    $testUser = $users | Where-Object { $_.role -ne 'admin' -and $_.employee_code -ne 'admin' } | Select-Object -First 1
    
    if ($testUser) {
        Write-Host "   Test user: $($testUser.full_name) ($($testUser.employee_code))" -ForegroundColor Cyan
        Write-Host "   Current status: $($testUser.is_active)" -ForegroundColor Cyan
        Write-Host ""
        
        # Test toggle status
        Write-Host "3. Testing toggle-status for user ID $($testUser.id)..." -ForegroundColor Yellow
        try {
            $toggleResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/users/$($testUser.id)/toggle-status" -Method Patch -Headers $headers
            Write-Host "✅ Toggle successful" -ForegroundColor Green
            Write-Host "   Message: $($toggleResponse.message)" -ForegroundColor Cyan
            Write-Host "   New status: $($toggleResponse.user.is_active)" -ForegroundColor Cyan
            Write-Host ""
            
            # Toggle back
            Write-Host "4. Toggling back to original status..." -ForegroundColor Yellow
            $toggleBackResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/users/$($testUser.id)/toggle-status" -Method Patch -Headers $headers
            Write-Host "✅ Toggle back successful" -ForegroundColor Green
            Write-Host "   Message: $($toggleBackResponse.message)" -ForegroundColor Cyan
            Write-Host "   Status: $($toggleBackResponse.user.is_active)" -ForegroundColor Cyan
            Write-Host ""
        } catch {
            Write-Host "❌ Toggle failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "   Error details: $($errorDetails.message)" -ForegroundColor Red
            }
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  No suitable test user found" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "❌ Failed to get users: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "🎉 Test completed!" -ForegroundColor Green
