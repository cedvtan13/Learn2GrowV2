# Password Reset System

The Learn2Grow application includes a complete password reset system that allows users to recover their accounts when they forget their passwords.

## How It Works

The password reset flow includes the following steps:

1. User requests a password reset by entering their email
2. System generates a reset token and sends an email with a reset link
3. User clicks the link and is taken to the reset password page
4. User enters a new password and submits the form
5. System verifies the token and updates the password
6. User is redirected to login with their new password

## Implementation Details

### Frontend Components

- **Forgot Password Page**: `forgot-password.html`
  - Allows users to enter their email address
  - Sends a request to the server to initiate the reset process

- **Reset Password Page**: `reset-password.html`
  - Receives the reset token via URL parameter
  - Provides form for users to enter a new password
  - Submits the new password and token to the server

### Backend Components

- **Reset Token Generation**: Created in `userRoutes.js`
  - Generates a JWT token with 1-hour expiry
  - Stores the token in the user document

- **Email Delivery**: Handled by `emailJSService.js`
  - Sends a formatted HTML email with reset link
  - Includes the token as a query parameter in the link

- **Password Update**: Processed in `userRoutes.js`
  - Verifies the token is valid and not expired
  - Updates the user's password with a newly hashed version
  - Clears the reset token from the user document

## Security Features

1. **Token Expiry**: Reset tokens expire after 1 hour
2. **One-Time Use**: Tokens are cleared after successful use
3. **Secure Storage**: Tokens are stored in the database, not just in the email
4. **Email Validation**: System verifies the email exists before sending
5. **Password Hashing**: New passwords are securely hashed before storage

## Testing

You can test the password reset system using:

```bash
npm run test-password-reset
```

This script tests the entire flow from requesting a reset to logging in with the new password.

## Configuration

The password reset system uses the following environment variables:

- `WEBSITE_URL`: Base URL of your website (for constructing reset links)
- `FROM_EMAIL`: Email address that sends the reset emails
- `NODE_ENV`: Environment mode (development/production)

## Production Considerations

When deploying to production:

1. Set `NODE_ENV=production` to ensure emails are sent to actual recipients
2. Configure proper SMTP credentials for reliable email delivery
3. Use HTTPS for your website to protect the reset tokens
4. Consider rate limiting password reset requests to prevent abuse
