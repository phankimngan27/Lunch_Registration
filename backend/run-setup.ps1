# Script để setup database trên Railway
Write-Host "Setting up database on Railway..." -ForegroundColor Green

# Chạy setup script trong Railway environment
railway run node scripts/setupDatabase.ts

Write-Host "`nSetup completed!" -ForegroundColor Green
