# Smart Locker Room Management System — One-Click Launcher

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🔒 Smart Locker Room Management System Launcher" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$workspaceDir = Get-Location

# 1. Check Node.js installation
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18+." -ForegroundColor Red
    exit 1
}

# 2. Seed Database
Write-Host "`n🌱 Initializing & Seeding SQLite Database..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "seed.js" -WorkingDirectory "$workspaceDir\backend" -Wait

# 3. Start Backend Server in Background
Write-Host "`n🚀 Starting Backend Express REST & WebSocket Server (Port 5000)..." -ForegroundColor Green
$backendProc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$workspaceDir\backend" -PassThru

# 4. Start Frontend Vite Server in Background
Write-Host "`n💻 Starting React Security Dashboard (Port 5173)..." -ForegroundColor Green
$frontendProc = Start-Process -FilePath "npx" -ArgumentList "vite" -WorkingDirectory "$workspaceDir\frontend" -PassThru

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "✅ Smart Locker System is running!" -ForegroundColor Green
Write-Host "📡 Backend API: http://localhost:5000" -ForegroundColor Yellow
Write-Host "🌐 Security Dashboard: http://localhost:5173" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C or close this window to exit."
