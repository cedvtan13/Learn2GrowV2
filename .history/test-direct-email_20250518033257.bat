@echo off
echo Learn2Grow Direct Email Test
echo =========================
echo.

:: Navigate to the project directory
cd "%~dp0"

echo This script will directly send test emails without using the database.
echo.

:: Prompt for recipient information
set /p email="Enter recipient email (or press Enter for default): "
set /p name="Enter recipient name (or press Enter for default): "

:: Build the command
set cmd=node testDirectSend.js

if not "%name%"=="" (
  set cmd=%cmd% --name="%name%"
)

if not "%email%"=="" (
  set cmd=%cmd% --email=%email%
)

:: Run the command
echo.
echo Running: %cmd%
echo.

%cmd%

echo.
echo Process complete.
pause
