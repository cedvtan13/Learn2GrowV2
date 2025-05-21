# Learn2Grow Email System Setup Guide

## Overview

Learn2Grow uses a robust email system powered by NodeMailer and EmailJS templates. This guide explains how to configure the email system for both development and production environments.

## Configuration Options

The email system supports two modes of operation:

1. **SMTP Email Delivery** (Production): Sends actual emails via SMTP
2. **Development Mode**: Logs emails to console and files instead of sending them

## Setting Up Your Environment

### Required Environment Variables

Add these variables to your `.env` file:

```
# EmailJS Configuration (For browser testing)
EMAILJS_USER_ID=your_emailjs_user_id
EMAILJS_SERVICE_ID=your_emailjs_service_id

# Direct Email Configuration (For server-side sending)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
FROM_EMAIL=noreply@learn2grow.org

# General Email Settings
WEBSITE_URL=http://localhost:3000
ADMIN_EMAIL=your_admin_email@example.com
VERIFIED_EMAILS=test1@example.com,test2@example.com
NODE_ENV=development  # Use 'production' for live emails
```

### Setting Up Gmail SMTP

1. **Create an App Password:**
   - Go to your Google Account > Security
   - Enable 2-Step Verification if not already enabled
   - Go to App Passwords
   - Select "Mail" as the app and "Other" as the device
   - Enter "Learn2Grow" as the name
   - Copy the generated password to your `.env` file

2. **Configure Your Environment:**
   ```
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASSWORD=your_app_password_from_google
   ```

## Development Mode

In development mode (when `NODE_ENV` is not set to 'production'), the system will:

1. Redirect all emails to addresses listed in `VERIFIED_EMAILS` for testing
2. Log email contents to console
3. Save email content to HTML files in the `email-logs` directory

## Email Templates

The system uses the following email templates:

1. **Password Reset** (`template_password_reset`)
2. **Recipient Verification** (`template_verification`)
3. **Existing User Notification** (`template_existing_user`)
4. **Pending Request Notification** (`template_pending`)
5. **Admin Notification** (`template_admin_notify`)
6. **Recipient Approval** (`template_approval`)
7. **Recipient Rejection** (`template_rejection`)

## Testing Email Functionality

You can test the email system using the provided test scripts:

```bash
# Test basic email functionality
node test-email-service.js

# Test all email templates
node test-email-templates.js

# Test EmailJS template rendering
node verify-emailjs-templates.js
```

## Browser-Based Template Testing

For visual testing of email templates, open `emailjs-template-tester.html` in your browser.

## Troubleshooting

### Common Issues

1. **Authentication Error:** Check your EMAIL_USER and EMAIL_PASSWORD values.
2. **Email Not Sending:** Verify that you're using an app password if using Gmail.
3. **Template Rendering Issues:** Check the EmailJS template IDs in your code.

### Logs

Check the `email-logs` directory for saved email content to debug template issues.

## Production Setup

For production:

1. Set `NODE_ENV=production` in your `.env` file
2. Configure proper SMTP credentials
3. Use a proper email address for `FROM_EMAIL`
4. Remove test email addresses from `VERIFIED_EMAILS`

## Security Considerations

- Never commit your `.env` file with real credentials
- Use environment variables in production
- Consider using a dedicated email service for high volume (AWS SES, Mailgun, etc.)
