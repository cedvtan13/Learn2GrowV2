@echo off
echo Learn2Grow Test Recipient Creation
echo ================================
echo.

:: Navigate to the project directory
cd "%~dp0"

echo This script will create a test recipient in the database and trigger all emails.
echo.

:: Prompt for recipient information
set /p name="Enter recipient name (or press Enter for default): "
set /p email="Enter recipient email (or press Enter for default): "
set /p password="Enter password (or press Enter for default): "

:: Build the command
set cmd=node addTestRecipient.js

if not "%name%"=="" (
  set cmd=%cmd% --name="%name%"
)

if not "%email%"=="" (
  set cmd=%cmd% --email=%email%
)

if not "%password%"=="" (
  set cmd=%cmd% --password=%password%
)

:: Run the command
echo.
echo Running: %cmd%
echo.

%cmd%

echo.
echo Process complete.
pause
