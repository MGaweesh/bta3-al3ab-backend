@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo ========================================
echo   Starting Backend Server...
echo ========================================
echo.
node server.js
pause

