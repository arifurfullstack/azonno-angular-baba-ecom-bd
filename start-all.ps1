# ===========================
# Azonnox - Unified Single App launcher
# ===========================
# Usage: Right-click -> "Run with PowerShell" or run in terminal: .\start-all.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AZONNOX - Unified Application        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Unified Server on http://localhost:4220 ..." -ForegroundColor Yellow
Write-Host "  Storefront: http://localhost:4220/" -ForegroundColor White
Write-Host "  Admin Panel:http://localhost:4220/admin" -ForegroundColor White
Write-Host "  API Backend:http://localhost:4220/api" -ForegroundColor White
Write-Host ""

npm run start
