# Learn2Grow Email System Setup Guide

## Setting up Gmail App Password for Learn2Grow

Learn2Grow uses Gmail's SMTP service to send automated emails. This requires setting up an App Password because Google's security doesn't allow direct password authentication for third-party apps.

### Steps to Create an App Password:

1. **Sign in to the Learn2Grow Gmail account**:
   - Go to https://accounts.google.com
   - Sign in with:
     - Email: learn2growad1@gmail.com
     - Password: *use the actual password*

2. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Find "2-Step Verification" under "Signing in to Google"
   - Follow the steps to turn it on if not already enabled
   - You may need to verify with a phone number

3. **Generate an App Password**:
   - After enabling 2-Step Verification, go back to https://myaccount.google.com/security
   - Find "App passwords" (under "Signing in to Google")
   - Select "App" dropdown: choose "Mail" 
   - Select "Device" dropdown: choose "Other (Custom name)"
   - Enter "Learn2Grow" as the custom name
   - Click "Generate"

4. **Copy the App Password**:
   - Google will display a 16-character app password
   - Copy this password (it will only be shown once!)

5. **Update the `.env` File**:
   - Open the `.env` file in your Learn2Grow project
   - Replace `EMAIL_PASS=your_app_password_from_google` with `EMAIL_PASS=your_generated_app_password`
   - Make sure to remove any spaces from the generated password

## Testing the Email System

After setting up the app password, follow these steps to test the email system:

1. **Test Real Email Sending**:
   ```bash
   node testRealEmail.js
   ```
   This will send a test email to learn2growad1@gmail.com to verify SMTP is working correctly.

2. **Test Recipient Email Templates**:
   ```bash
   node testRecipientEmails.js
   ```
   This tests all recipient-related email templates.

3. **Test Email Automation**:
   ```bash
   node sendAutomatedEmails.js
   ```
   This tests the automated sending of pending emails from the database.

4. **Run Scheduled Email Service**:
   ```bash
   node scheduledEmails.js
   ```
   This starts the service that automatically processes pending emails every hour.

## Troubleshooting

- **Authentication Errors**: Double-check that the app password was copied correctly with no spaces
- **Connection Errors**: Make sure port 587 is not blocked by any firewalls
- **Gmail Limits**: Gmail has sending limits (500 emails/day) - monitor usage for larger deployments
