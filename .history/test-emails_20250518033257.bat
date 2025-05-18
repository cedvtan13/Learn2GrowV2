@echo off
echo Learn2Grow Email Testing Tool
echo ============================
echo.

:: Navigate to the project directory
cd "%~dp0"

:: Options Menu
echo Select an option:
echo 1. Process all pending emails
echo 2. Process emails for a specific recipient
echo 3. Send verification emails to all pending recipients
echo 4. Force resend all emails
echo 5. View email logs
echo 6. Exit
echo.

set /p option="Enter option number: "

if "%option%"=="1" goto process_all
if "%option%"=="2" goto process_specific
if "%option%"=="3" goto verify_all
if "%option%"=="4" goto force_resend
if "%option%"=="5" goto view_logs
if "%option%"=="6" goto end

:process_all
powershell -Command ".\process-emails.ps1"
goto end

:process_specific
set /p email="Enter recipient email address: "
powershell -Command ".\process-emails.ps1 -email %email%"
goto end

:verify_all
powershell -Command ".\process-emails.ps1 -verifyAll"
goto end

:force_resend
powershell -Command ".\process-emails.ps1 -force"
goto end

:view_logs
powershell -Command ".\manage-services.ps1 email-logs"
goto end

:end
echo.
pause
