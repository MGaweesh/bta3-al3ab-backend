@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
echo Starting Frontend Server...
npm run dev
pause

