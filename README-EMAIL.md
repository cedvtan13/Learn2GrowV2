# Resend Email Verification System

## Overview
This system uses Resend.com's API to send verification emails for user registration in the Learn2Grow donation web app. The implementation checks if users already exist in MongoDB and sends appropriate emails based on their status.

## Features
- Sends verification emails to new recipient registrations
- Notifies existing users who try to register again
- Alerts users with pending registrations
- Sends admin notifications for new registrations
- Sends approval/rejection emails when admin processes requests
- Supports multiple verified email addresses for testing

## Configuration

### Environment Variables
Add these to your `.env` file:
```
# Required settings
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
WEBSITE_URL=http://localhost:3000
ADMIN_EMAIL=your_admin_email@example.com

# Comma-separated list of verified emails for testing
VERIFIED_EMAILS=your_verified_email@example.com,another_verified_email@example.com
```

### Using Multiple Recipient Emails

#### Free Tier Limitations
With Resend's free tier, you can only send emails to verified email addresses. The system has two modes:

1. **Development Mode** (default):
   - If a recipient's email is verified (in VERIFIED_EMAILS), the email goes directly to them
   - If a recipient's email is not verified, the email is redirected to your primary verified email

2. **Production Mode** (when NODE_ENV=production):
   - Emails are sent directly to all recipients
   - Requires either domain verification or a paid Resend plan

#### Verifying Additional Emails
To add more verified emails for testing:

1. Run the verification tool:
   ```
   node verify-email.js
   ```

2. Enter the email address you want to verify

3. Check that email's inbox for the verification email

4. Update your .env file to include the new email:
   ```
   VERIFIED_EMAILS=21101045@usc.edu.ph,your_new_email@example.com
   ```

## Email Service Functions

### Main Functions
- `processRecipientRegistration(name, email)`: Checks user status and sends appropriate email
- `sendNewRecipientVerificationEmail(name, email)`: Sends verification to new users
- `sendExistingUserEmail(name, email)`: Notifies users who already have an account
- `sendPendingRequestEmail(name, email)`: Alerts users who have a pending request
- `sendRecipientRequestToAdmin(name, email)`: Notifies admin of new registration
- `sendRecipientApproval(name, email)`: Confirms account approval
- `sendRecipientRejection(name, email, reason)`: Explains rejection reason

### Core Function
- `sendEmail(to, subject, html)`: Generic email sending function with smart redirection

## Email Templates
All emails use responsive HTML templates with:
- Friendly, professional language
- Clear instructions
- Learn2Grow branding
- Action buttons where appropriate
- Contact information

## Integration with User Registration
The email system is integrated with the user registration workflow:

1. When a new user submits a registration form, the system:
   - Checks if the email already exists in MongoDB
   - Sends appropriate email based on user status
   - Stores the registration request if new

2. When an admin approves/rejects a request:
   - System sends approval email with login instructions, or
   - System sends rejection email with explanation

## Testing Tools

### Test All Templates
```
node test-email-templates.js
```

### Direct Resend API Test
```
node test-resend-direct.js
```

### Verify New Email Addresses
```
node verify-email.js
```

## Production Deployment

For production use, you have two options:

1. **Verify Your Domain with Resend**:
   - Register and verify your domain at https://resend.com/domains
   - Update FROM_EMAIL to use your domain
   - Set NODE_ENV=production in your environment

2. **Use Resend's Paid Plan**:
   - Upgrade to remove sending restrictions
   - Continue using onboarding@resend.dev as your FROM_EMAIL
   - Set NODE_ENV=production in your environment

## Troubleshooting

If emails aren't being sent:
1. Check that `RESEND_API_KEY` is set correctly in `.env`
2. Verify the API key is valid in the Resend dashboard
3. Ensure recipient emails are either verified or you're in production mode
4. Check console logs for any error messages
5. Check your Resend dashboard for failed deliveries
