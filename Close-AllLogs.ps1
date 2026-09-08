# Healthcare AI - Close All Log Windows
# بستن همه پنجره‌های CMD لاگ

$containers = @(
    "healthcare-auth",
    "healthcare-gateway",
    "profile-service",
    "healthcare-postgres",
    "healthcare-redis",
    "minio",
    "healthcare-frontend"
)

Write-Host "در حال بستن پنجره‌های لاگ..." -ForegroundColor Yellow

# بستن پنجره‌های CMD با عنوان خاص
Get-Process | Where-Object { 
    $_.ProcessName -eq "cmd" -and (
        $_.MainWindowTitle -match "Auth Service" -or
        $_.MainWindowTitle -match "API Gateway" -or
        $_.MainWindowTitle -match "Profile Service" -or
        $_.MainWindowTitle -match "PostgreSQL" -or
        $_.MainWindowTitle -match "Redis" -or
        $_.MainWindowTitle -match "MinIO" -or
        $_.MainWindowTitle -match "Frontend"
    )
} | Stop-Process -Force

Write-Host "✅ همه پنجره‌های لاگ بسته شدند!" -ForegroundColor Green
