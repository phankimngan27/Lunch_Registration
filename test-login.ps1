# Test login API
$body = @{
    email = "admin@madison.dev"
    password = "1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://backend-production-c464.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"

Write-Host "Login thành công!" -ForegroundColor Green
Write-Host "Token: $($response.token)"
Write-Host "User: $($response.user.full_name)"
