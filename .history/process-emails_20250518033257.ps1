# process-emails.ps1
# PowerShell script to manually process emails for Learn2Grow

param (
    [string]$email = "",
    [switch]$force = $false,
    [switch]$verifyAll = $false,
    [switch]$help = $false
)

# Define colors
$GREEN = [System.ConsoleColor]::Green
$RED = [System.ConsoleColor]::Red
$YELLOW = [System.ConsoleColor]::Yellow
$CYAN = [System.ConsoleColor]::Cyan

# Display header
Write-Host ""
Write-Host "Learn2Grow Email Processor" -ForegroundColor $CYAN
Write-Host "------------------------" -ForegroundColor $CYAN
Write-Host ""

# Function to display usage information
function Show-Usage {
    Write-Host "Usage: ./process-emails.ps1 [options]" -ForegroundColor $YELLOW
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $YELLOW
    Write-Host "  -email <email>  Process emails for a specific recipient" -ForegroundColor $CYAN
    Write-Host "  -force          Force reprocessing of all emails, even if already sent" -ForegroundColor $CYAN
    Write-Host "  -verifyAll      Send verification emails to all pending recipients" -ForegroundColor $CYAN
    Write-Host "  -help           Display this help message" -ForegroundColor $CYAN
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $YELLOW
    Write-Host "  ./process-emails.ps1                       # Process all pending emails" -ForegroundColor $CYAN
    Write-Host "  ./process-emails.ps1 -email user@test.com  # Process only for this recipient" -ForegroundColor $CYAN
    Write-Host "  ./process-emails.ps1 -force                # Force resend all emails" -ForegroundColor $CYAN
    Write-Host "  ./process-emails.ps1 -verifyAll           # Send verification to all pending recipients" -ForegroundColor $CYAN
    Write-Host ""
}

# Show help if requested
if ($help) {
    Show-Usage
    exit 0
}

# Build the command line arguments
$cmdArgs = "processEmails.js"

if ($email) {
    $cmdArgs += " --email=$email"
    Write-Host "Processing emails for recipient: $email" -ForegroundColor $YELLOW
}

if ($force) {
    $cmdArgs += " --force"
    Write-Host "Forcing reprocessing of all emails" -ForegroundColor $YELLOW
}

if ($verifyAll) {
    $cmdArgs += " --verify-all"
    Write-Host "Processing verification emails for all pending recipients" -ForegroundColor $YELLOW
}

if (-not $email -and -not $force -and -not $verifyAll) {
    Write-Host "Processing all pending emails" -ForegroundColor $YELLOW
}

# Execute the command
Write-Host "Running: node $cmdArgs" -ForegroundColor $CYAN
Write-Host ""

try {
    & node $cmdArgs
    Write-Host "`nEmail processing completed." -ForegroundColor $GREEN
} catch {
    Write-Host "`nError running email processor: $_" -ForegroundColor $RED
    exit 1
}
