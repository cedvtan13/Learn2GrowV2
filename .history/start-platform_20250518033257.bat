@echo off
echo Starting Learn2Grow Platform...
echo.

:: Navigate to the project directory - replace this with the actual path if needed
cd "%~dp0"

:: Use powershell to start the services
powershell -Command ".\manage-services.ps1 status"

echo.
echo To open the monitoring dashboard, run: .\manage-services.ps1 monit
echo To check logs, run: .\manage-services.ps1 logs
echo.

:: Keep the window open
pause
