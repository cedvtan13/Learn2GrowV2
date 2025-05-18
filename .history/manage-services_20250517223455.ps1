# manage-services.ps1
# PowerShell script to manage Learn2Grow services with PM2

param (
    [string]$action = "status"
)

# Define colors for better readability
$GREEN = [System.ConsoleColor]::Green
$RED = [System.ConsoleColor]::Red
$YELLOW = [System.ConsoleColor]::Yellow
$CYAN = [System.ConsoleColor]::Cyan

# Display header
Write-Host ""
Write-Host "Learn2Grow Service Manager" -ForegroundColor $CYAN
Write-Host "------------------------" -ForegroundColor $CYAN
Write-Host ""

# Function to display usage information
function Show-Usage {
    Write-Host "Usage: ./manage-services.ps1 [action]" -ForegroundColor $YELLOW
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor $YELLOW
    Write-Host "  start      - Start all Learn2Grow services" -ForegroundColor $CYAN
    Write-Host "  stop       - Stop all Learn2Grow services" -ForegroundColor $CYAN
    Write-Host "  restart    - Restart all Learn2Grow services" -ForegroundColor $CYAN
    Write-Host "  status     - Show status of all services (default)" -ForegroundColor $CYAN
    Write-Host "  logs       - Show logs for all services" -ForegroundColor $CYAN
    Write-Host "  email-logs - Show only email service logs" -ForegroundColor $CYAN
    Write-Host "  monit      - Open PM2 monitoring dashboard" -ForegroundColor $CYAN
    Write-Host "  email      - Run processEmails.js once for manual email processing" -ForegroundColor $CYAN
    Write-Host "  save       - Save current PM2 process list for automatic startup" -ForegroundColor $CYAN
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $YELLOW
    Write-Host "  ./manage-services.ps1 start" -ForegroundColor $CYAN
    Write-Host "  ./manage-services.ps1 logs" -ForegroundColor $CYAN
    Write-Host ""
}

# Check if PM2 is installed
try {
    $pm2Version = & pm2 --version
    Write-Host "PM2 Version: $pm2Version" -ForegroundColor $GREEN
} catch {
    Write-Host "Error: PM2 is not installed or not in your PATH." -ForegroundColor $RED
    Write-Host "Please install PM2 first with: npm install -g pm2" -ForegroundColor $YELLOW
    exit 1
}

# Process the action
switch ($action) {
    "start" {
        Write-Host "Starting Learn2Grow services..." -ForegroundColor $YELLOW
        & pm2 start ecosystem.config.js
    }
    "stop" {
        Write-Host "Stopping Learn2Grow services..." -ForegroundColor $YELLOW
        & pm2 stop ecosystem.config.js
    }
    "restart" {
        Write-Host "Restarting Learn2Grow services..." -ForegroundColor $YELLOW
        & pm2 restart ecosystem.config.js
    }
    "status" {
        Write-Host "Checking service status..." -ForegroundColor $YELLOW
        & pm2 list
    }
    "logs" {
        Write-Host "Showing logs for all services (Ctrl+C to exit)..." -ForegroundColor $YELLOW
        & pm2 logs
    }
    "email-logs" {
        Write-Host "Showing logs for email service (Ctrl+C to exit)..." -ForegroundColor $YELLOW
        & pm2 logs learn2grow-emails
    }
    "monit" {
        Write-Host "Opening PM2 monitoring dashboard (Ctrl+C to exit)..." -ForegroundColor $YELLOW
        & pm2 monit
    }
    "email" {
        Write-Host "Running manual email processing..." -ForegroundColor $YELLOW
        & node processEmails.js
    }
    "save" {
        Write-Host "Saving PM2 process list for automatic startup..." -ForegroundColor $YELLOW
        & pm2 save
        
        Write-Host "`nTo enable auto-start on system boot, run:" -ForegroundColor $CYAN
        Write-Host "pm2 startup" -ForegroundColor $GREEN
        Write-Host "And then follow the instructions it provides." -ForegroundColor $CYAN
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Host "Unknown action: $action" -ForegroundColor $RED
        Show-Usage
        exit 1
    }
}

Write-Host "`nDone." -ForegroundColor $GREEN
