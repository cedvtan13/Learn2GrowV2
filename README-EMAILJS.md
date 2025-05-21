# EmailJS Setup for Learn2Grow

This document explains how to set up EmailJS for the Learn2Grow donation platform.

## Overview

The application uses EmailJS for all email communication. EmailJS allows sending emails directly from client-side JavaScript or server-side Node.js without needing to set up a separate email server.

## Getting Started

### 1. Sign up for EmailJS

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/) and create an account
2. After signing up, go to your dashboard

### 2. Create an Email Service

1. In the EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the authentication steps for your chosen provider
5. Note down the **Service ID** that is generated (e.g., `service_abc123`)

### 3. Create Email Templates

You need to create the following templates in the EmailJS dashboard:

| Template Name | Template ID |
|---------------|-------------|
| Recipient Verification | `template_verification` |
| Existing User | `template_existing_user` |
| Pending Request | `template_pending` |
| Admin Notification | `template_admin_notify` |
| Recipient Approval | `template_approval` |
| Recipient Rejection | `template_rejection` |
| Password Reset | `template_password_reset` |

For each template:
1. Go to "Email Templates" in the dashboard
2. Click "Create New Template"
3. Design your template using the EmailJS editor
4. Make sure to include these variables in your templates:

#### Common variables for all templates:
- `{{to_name}}` - Recipient's name
- `{{to_email}}` - Recipient's email
- `{{website_url}}` - Website URL
- `{{subject}}` - Email subject

#### Template-specific variables:
- **Password Reset Template**: `{{reset_link}}`
- **Rejection Template**: `{{rejection_reason}}`
- **Admin Notification Template**: `{{recipient_name}}`, `{{recipient_email}}`

### 4. Configure Environment Variables

Add these variables to your `.env` file:

```
# EmailJS Configuration
EMAILJS_USER_ID=your_user_id
EMAILJS_SERVICE_ID=your_service_id

# For testing
VERIFIED_EMAILS=test1@example.com,test2@example.com
```

## Testing

After setup, you can run various test scripts to verify your email configuration:

- `node test-email-templates.js` - Tests all email templates
- `node test-redirect.js` - Tests email redirection in development mode

## Troubleshooting

### Common Issues

1. **Emails not sending**: 
   - Check if your EmailJS API keys are correctly set in the .env file
   - Verify your service connection in the EmailJS dashboard

2. **Template variables not working**:
   - Make sure template variables exactly match what's expected in the code
   - Check for typos in variable names

3. **Rate limits**:
   - Free tier of EmailJS has sending limits. Check your usage in the dashboard

## Additional Resources

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [EmailJS API Reference](https://www.emailjs.com/docs/api/api-reference/)
