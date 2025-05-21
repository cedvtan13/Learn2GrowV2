// test-email-verification.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { sendNewRecipientVerificationEmail } from './utils/emailJSService.js';

dotenv.config();

// Generate a mock verification token
const mockToken = 'test_verification_token_' + Date.now();

// Function to save email content for debugging
const saveVerificationEmailForDebugging = async () => {
  try {
    // Create HTML file for testing
    const verificationLink = `${process.env.WEBSITE_URL || 'http://localhost:3000'}/api/users/verify-email?token=${mockToken}`;
    const debugHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Direct Verification Email Test</title>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px;">
        <h2 style="color: #4CAF50;">Verify Your Email Address</h2>
        <p>Hello Test User,</p>
        <p>Thank you for registering with Learn2Grow. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
        </div>
        <p>This verification link will expire in 24 hours.</p>
        <p>After verifying your email, your application will be submitted for review by our admin team. We'll notify you once your application has been approved.</p>
        <p>If you're unable to click the button, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 12px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
        <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>The Learn2Grow Team</p>
      </body>
      </html>
    `;

    const debugFilePath = path.join(process.cwd(), 'direct-verification-email-test.html');
    fs.writeFileSync(debugFilePath, debugHtml);
    console.log(`Debug email file created at: ${debugFilePath}`);
    
    return debugFilePath;
  } catch (error) {
    console.error('Error creating debug file:', error);
    return null;
  }
};

// Test function
async function testEmailVerification() {
  console.log('Testing email verification...');
  
  try {
    // Generate the test recipient info
    const testName = 'Test User';
    // Use your actual email for testing
    const testEmail = process.env.TEST_EMAIL || 'cedv.tan@gmail.com';
    
    console.log(`Sending verification email to: ${testEmail}`);
    console.log(`Using token: ${mockToken}`);
    
    // Create a debug HTML file for reference
    const debugFilePath = await saveVerificationEmailForDebugging();
    
    // Send the actual email
    const result = await sendNewRecipientVerificationEmail(testName, testEmail, mockToken);
    
    console.log('Email sent successfully!');
    
    // Output the verification link for testing
    const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    console.log(`\nVerification Link: ${websiteUrl}/api/users/verify-email?token=${mockToken}`);
    
    console.log('\nPlease check your actual email inbox for the verification email.');
    console.log('The email should now contain a verification button that links to the verification endpoint.');
    
    if (debugFilePath) {
      console.log(`\nYou can also open the debug file to see how the email should look: ${debugFilePath}`);
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}

// Run the test
testEmailVerification();

// Run the test
testEmailVerification();
