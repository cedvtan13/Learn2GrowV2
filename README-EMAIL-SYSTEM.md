# Learn2Grow Email System Documentation

## Migration Complete: Switched from Resend to EmailJS/NodeMailer

This document provides a comprehensive guide to the Learn2Grow email system, which has been migrated from Resend to EmailJS with NodeMailer.

## System Architecture

The Learn2Grow email system follows a hybrid approach:
1. **Server-side**: Uses NodeMailer for delivering emails via SMTP
2. **Templates**: Uses EmailJS template structure for consistent styling
3. **Fallback**: Includes a development mode with console logging and file saving

## Configuration

### Environment Variables

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
ADMIN_EMAIL=admin@example.com
VERIFIED_EMAILS=test1@example.com,test2@example.com
NODE_ENV=development  # Use 'production' for live emails
```

### Required Templates

| Purpose | Template ID | Description |
|---------|-------------|-------------|
| Password Reset | `template_password_reset` | Sends reset links to users |
| Recipient Verification | `template_verification` | Confirms registration requests |
| Existing User | `template_existing_user` | For duplicate registration attempts |
| Pending Request | `template_pending` | For duplicate pending requests |
| Admin Notification | `template_admin_notify` | Notifies admins of new registrations |
| Recipient Approval | `template_approval` | Confirms account approval |
| Recipient Rejection | `template_rejection` | Explains rejection reasons |

## Development Mode Features

When `NODE_ENV` is not set to `production`:

1. **Email Redirection**: All emails are redirected to addresses in the `VERIFIED_EMAILS` list
2. **Console Logging**: Full email content is logged to the console
3. **File Saving**: HTML email content is saved to the `email-logs` directory with timestamps
4. **Redirection Notice**: Redirected emails include a notice showing the original recipient

## Testing Tools

The system includes several testing tools:

1. `test-email-service.js`: Tests basic email functionality
2. `test-email-templates.js`: Tests all email templates
3. `verify-emailjs-templates.js`: Verifies EmailJS template rendering
4. `emailjs-template-tester.html`: Browser-based template testing tool

## Implementation Details

The main service is implemented in:
- `utils/emailJSService.js`: The core email service with NodeMailer integration

Key features include:
- SMTP email sending via NodeMailer
- Graceful fallback to logging when SMTP isn't available
- Development mode with email redirection
- HTML template rendering with variable substitution
- Comprehensive error handling and logging

## Production Recommendations

For production deployment:

1. **SMTP Provider**: Use a dedicated SMTP provider (SendGrid, AWS SES, Mailgun)
2. **Environment Config**: Set `NODE_ENV=production`
3. **Domain Validation**: Set up SPF and DKIM records for your domain
4. **Monitoring**: Implement email delivery monitoring
5. **Rate Limiting**: Add rate limiting for email sending operations

## See Also

- [EMAIL-SETUP-GUIDE.md](./EMAIL-SETUP-GUIDE.md): Detailed setup instructions
- [EMAILJS-MIGRATION-CHECKLIST.md](./EMAILJS-MIGRATION-CHECKLIST.md): Migration status and checklist
