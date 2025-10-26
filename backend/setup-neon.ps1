# PowerShell script to setup Neon database
# Usage: .\setup-neon.ps1 "postgresql://your-connection-string"

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🔗 Setting up Neon database..." -ForegroundColor Green
Write-Host "URL: $($DatabaseUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Yellow

$env:DATABASE_URL = $DatabaseUrl
node setup-neon.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Setup thành công!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Setup thất bại!" -ForegroundColor Red
    exit 1
}
