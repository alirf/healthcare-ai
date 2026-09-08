@echo off
chcp 65001 >nul
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║           Healthcare AI - Log Monitor                         ║
echo ║           مانیتور لاگ سرویس‌ها                                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo در حال باز کردن CMD جداگانه برای هر سرویس...
echo.

start "🔐 Auth Service" cmd /k "docker logs -f healthcare-auth"
timeout /t 1 /nobreak >nul

start "🚪 API Gateway" cmd /k "docker logs -f healthcare-gateway"
timeout /t 1 /nobreak >nul

start "👤 Profile Service" cmd /k "docker logs -f profile-service"
timeout /t 1 /nobreak >nul

start "🗄️ PostgreSQL" cmd /k "docker logs -f healthcare-postgres"
timeout /t 1 /nobreak >nul

start "⚡ Redis" cmd /k "docker logs -f healthcare-redis"
timeout /t 1 /nobreak >nul

start "📦 MinIO" cmd /k "docker logs -f minio"
timeout /t 1 /nobreak >nul

start "🌐 Frontend" cmd /k "docker logs -f healthcare-frontend"

echo.
echo ✅ همه پنجره‌های CMD باز شدند!
echo.
pause
