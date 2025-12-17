@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   جلب متطلبات الألعاب الناقصة
echo ========================================
echo.
node scripts\fetch-missing-requirements.js
echo.
echo ========================================
pause

