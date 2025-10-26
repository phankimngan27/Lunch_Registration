# Setup database using public connection
Write-Host "Getting DATABASE_URL from Railway..." -ForegroundColor Green

# Get the public DATABASE_URL
$dbUrl = railway variables get DATABASE_URL

if ($dbUrl) {
    Write-Host "Connecting to database..." -ForegroundColor Yellow
    
    # Run SQL file using psql with public URL
    Get-Content ../database/railway-setup.sql | railway run psql "$dbUrl"
    
    Write-Host "`nSetup completed!" -ForegroundColor Green
} else {
    Write-Host "Error: Could not get DATABASE_URL" -ForegroundColor Red
    Write-Host "Please check Railway variables" -ForegroundColor Yellow
}
