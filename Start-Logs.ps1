# Healthcare AI - Log Monitor
# باز کردن CMD جداگانه برای هر سرویس

$services = @(
    @{ Name = "🔐 Auth Service";    Container = "healthcare-auth";     Color = "Green" },
    @{ Name = "🚪 API Gateway";     Container = "healthcare-gateway";  Color = "Cyan" },
    @{ Name = "👤 Profile Service"; Container = "profile-service";     Color = "Yellow" },
    @{ Name = "🗄️  PostgreSQL";      Container = "healthcare-postgres";   Color = "Magenta" },
    @{ Name = "⚡ Redis";            Container = "healthcare-redis";      Color = "Red" },
    @{ Name = "📦 MinIO";            Container = "minio";                 Color = "Blue" },
    @{ Name = "🌐 Frontend";         Container = "healthcare-frontend";   Color = "White" }
)

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Healthcare AI - Log Monitor                         ║" -ForegroundColor Cyan
Write-Host "║           مانیتور لاگ سرویس‌ها                                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "در حال باز کردن CMD جداگانه برای هر سرویس..." -ForegroundColor Green
Write-Host ""

foreach ($svc in $services) {
    $title = $svc.Name
    $container = $svc.Container
    $color = $svc.Color

    Write-Host "  ▶ $title " -NoNewline -ForegroundColor $color

    # باز کردن CMD جدید با لاگ docker
    Start-Process cmd -ArgumentList "/k", "title $title && docker logs -f $container" -WindowStyle Normal

    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "✅ همه پنجره‌های CMD باز شدند!" -ForegroundColor Green
Write-Host ""
Write-Host "برای بستن همه: Close-AllLogs.ps1" -ForegroundColor Yellow
