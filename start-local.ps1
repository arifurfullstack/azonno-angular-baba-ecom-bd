# ===================================================
# Azonnox Local Development Starter
# Run this script to start the full stack locally
# ===================================================
# Usage: Right-click -> "Run with PowerShell" OR run: .\start-local.ps1

$mongodPath = "C:\data\mongodb7-extract\mongodb-win32-x86_64-windows-7.0.21\bin\mongod.exe"
$dbPath     = "C:\data\db"
$logPath    = "C:\data\mongod.log"
$appRoot    = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AZONNOX - Local Development Starter  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ensure data directory exists
if (-not (Test-Path $dbPath)) { New-Item -ItemType Directory -Force -Path $dbPath | Out-Null }

# 2. Start MongoDB in background
Write-Host "Starting MongoDB..." -ForegroundColor Yellow
$mongodProc = Start-Process -FilePath $mongodPath `
    -ArgumentList "--dbpath $dbPath --port 27017 --bind_ip 127.0.0.1 --logpath $logPath --logappend" `
    -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3
$port = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($port) {
    Write-Host "  MongoDB running on port 27017 " -ForegroundColor Green
} else {
    Write-Host "  WARNING: MongoDB may not have started. Check C:\data\mongod.log" -ForegroundColor Red
}

# 3. Start unified Node.js application
Write-Host ""
Write-Host "Starting Unified Application..." -ForegroundColor Yellow
Write-Host "  Storefront : http://localhost:4220/" -ForegroundColor White
Write-Host "  Admin Panel: http://localhost:4220/admin" -ForegroundColor White
Write-Host "  API Backend: http://localhost:4220/api" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Gray
Write-Host ""

$env:PORT = "4220"
$env:INTERNAL_API_PORT = "3000"

try {
    node "$appRoot\start-unified.js"
} finally {
    Write-Host ""
    Write-Host "Stopping MongoDB..." -ForegroundColor Yellow
    if ($mongodProc -and !$mongodProc.HasExited) { $mongodProc.Kill() }
    Write-Host "All services stopped." -ForegroundColor Green
}
