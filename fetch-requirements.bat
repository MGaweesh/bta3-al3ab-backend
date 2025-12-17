@echo off
echo ========================================
echo Fetching Requirements for All Games
echo ========================================
echo.
cd /d "%~dp0"
node scripts/fetch-all-requirements-now.js
pause

