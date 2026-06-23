# ===========================
# Azonnox - Start All Apps
# ===========================
# Usage: Right-click -> "Run with PowerShell" or run in terminal: .\start-all.ps1
#
# This script starts all three apps in separate terminal windows:
#   - API  (NestJS)  -> http://localhost:3000/api
#   - Admin (Angular) -> http://localhost:4200
#   - Theme (Angular) -> http://localhost:4220

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AZONNOX - Starting All Applications  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start API (NestJS) on port 3000
Write-Host "[1/3] Starting API (NestJS) on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '.\apix'; Write-Host 'Starting API Server...' -ForegroundColor Green; npm.cmd run start:dev"

# Start Admin (Angular) on port 4200
Write-Host "[2/3] Starting Admin (Angular) on port 4200..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '.\adminx'; Write-Host 'Starting Admin Panel...' -ForegroundColor Green; npm.cmd run start -- --port 4200"

# Start Theme (Angular SSR) on port 4220
Write-Host "[3/3] Starting Theme (Angular SSR) on port 4220..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '.\themex'; Write-Host 'Starting Theme (Storefront)...' -ForegroundColor Green; npm.cmd run start -- --port 4220"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All apps are starting!                " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  API:   http://localhost:3000/api" -ForegroundColor White
Write-Host "  Admin: http://localhost:4200" -ForegroundColor White
Write-Host "  Theme: http://localhost:4220" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C in each window to stop." -ForegroundColor DarkGray
Write-Host ""
