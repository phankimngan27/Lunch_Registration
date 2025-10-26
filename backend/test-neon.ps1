# PowerShell script to test Neon connection
# Usage: .\test-neon.ps1 "postgresql://your-connection-string"

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🔗 Testing Neon connection..." -ForegroundColor Green

$env:DATABASE_URL = $DatabaseUrl
node test-neon-connection.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Test thành công!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Test thất bại!" -ForegroundColor Red
    exit 1
}
