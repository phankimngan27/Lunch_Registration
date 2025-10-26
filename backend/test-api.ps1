# Test API endpoints
Write-Host "🧪 Testing API endpoints..." -ForegroundColor Green
Write-Host ""

# Test health endpoint
Write-Host "1. Testing /api/health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Host "✅ Health check OK" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test login
Write-Host "2. Testing /api/auth/login..." -ForegroundColor Yellow
try {
    $body = @{
        email = "admin@madison.dev"
        password = "1234"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   User: $($response.user.full_name)" -ForegroundColor Cyan
    Write-Host "   Role: $($response.user.role)" -ForegroundColor Cyan
    Write-Host ""
    
    $token = $response.token
    
    # Test protected endpoint
    Write-Host "3. Testing /api/auth/profile (protected)..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method Get -Headers $headers
    Write-Host "✅ Profile retrieved" -ForegroundColor Green
    Write-Host "   Name: $($profile.full_name)" -ForegroundColor Cyan
    Write-Host "   Email: $($profile.email)" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "🎉 API tests completed!" -ForegroundColor Green
