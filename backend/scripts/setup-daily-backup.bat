@echo off
REM Setup daily backup task for Windows

echo Setting up daily MongoDB backup task...

REM Create scheduled task to run daily at 2 AM
schtasks /create /tn "MongoDB_Daily_Backup" /tr "node \"%~dp0auto-backup-mongodb.js\"" /sc daily /st 02:00 /f

if %errorlevel% equ 0 (
    echo ✅ Daily backup task created successfully!
    echo Task will run every day at 2:00 AM
    echo.
    echo To run backup manually: node backend/scripts/auto-backup-mongodb.js
    echo To view task: schtasks /query /tn "MongoDB_Daily_Backup"
    echo To delete task: schtasks /delete /tn "MongoDB_Daily_Backup" /f
) else (
    echo ❌ Failed to create task. Run this script as Administrator.
)

pause
