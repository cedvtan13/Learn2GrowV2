# EmailJS Setup Instructions

## Quick Setup Guide

1. **Sign Up for EmailJS**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/) and create an account

2. **Get Your EmailJS User ID**
   - In your EmailJS dashboard, find your User ID under "Integration"
   - Add it to your .env file as `EMAILJS_USER_ID=your_user_id`

3. **Create an Email Service**
   - In EmailJS dashboard, go to "Email Services" and connect your email provider
   - Note the Service ID and add it to your .env file as `EMAILJS_SERVICE_ID=your_service_id`

4. **Create Email Templates**
   - Create templates for each email type as outlined below
   - Make sure to include all required variables in each template

## Required Email Templates

Create these templates in your EmailJS dashboard:

| Purpose | Template ID |
|---------|-------------|
| Recipient Verification | `template_verification` |
| Existing User | `template_existing_user` |
| Pending Request | `template_pending` |
| Admin Notification | `template_admin_notify` |
| Recipient Approval | `template_approval` |
| Recipient Rejection | `template_rejection` |
| Password Reset | `template_password_reset` |

## Testing

Run the following to test your setup:
```
node test-emailjs.js
```

For more detailed instructions, see README-EMAILJS.md.
