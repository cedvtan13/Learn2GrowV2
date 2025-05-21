# Password Reset Test Plan

This document outlines the testing of the complete password reset flow in the Learn2Grow application.

## Test Flow

### 1. Forgot Password Request

1. Navigate to the forgot-password.html page
2. Enter a registered email address
3. Click "Reset Password"
4. Verify success message appears
5. Check that an email is sent to the user

### 2. Email Verification

1. Check that the email contains:
   - A proper greeting with the user's name
   - Clear instructions for resetting the password
   - A functioning reset link
   - Proper Learn2Grow branding

### 3. Password Reset Page

1. Click the reset link in the email
2. Verify you are redirected to reset-password.html with a token parameter
3. Enter a new password and confirm it
4. Submit the form
5. Verify success message appears
6. Verify you are redirected to the login page

### 4. Login with New Password

1. On the login page, enter your email and the new password
2. Verify successful login
3. Verify you can access protected resources

## Testing Instructions

### To Test in Development Mode:

1. Set `NODE_ENV=development` in .env file
2. Add your email to `VERIFIED_EMAILS` in .env
3. Run the server: `node server.js`
4. Open http://localhost:3000/pages/forgot-password.html
5. Enter the email that's in the `VERIFIED_EMAILS` list
6. Check the `email-logs` directory for the password reset email
7. Copy the reset link from the email
8. Navigate to that link manually
9. Complete the reset process

### To Test in Production Mode:

1. Set `NODE_ENV=production` in .env file
2. Configure proper SMTP credentials in .env
3. Run the server: `node server.js`
4. Open http://localhost:3000/pages/forgot-password.html
5. Enter your actual email address
6. Check your email inbox for the reset email
7. Click the link in the email
8. Complete the reset process

## Troubleshooting

If issues occur:

1. Check browser console for JavaScript errors
2. Check server logs for backend errors
3. Verify the email service is working correctly
4. Check that the token is properly passed in the URL

## Expected Results

A successful test will show:
- Password reset emails are delivered to the user's inbox
- Reset links in the emails are valid and work when clicked
- Users can set a new password through the reset form
- Users can log in with their new password immediately after reset
- Appropriate error messages are shown for invalid inputs or expired tokens
