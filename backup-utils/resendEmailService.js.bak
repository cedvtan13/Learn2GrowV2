// utils/resendEmailService.js
import { Resend } from 'resend';
import User from '../models/userModel.js';
import RecipientRequest from '../models/recipientRequestModel.js';

// Check for required environment variables
console.log('Environment check for Resend:');

// Fallback API key from .env file
const API_KEY = process.env.RESEND_API_KEY || 're_dtJxGRrC_A9tonZhoKHfGaqaSXWSGvCqQ';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const VERIFIED_EMAILS = (process.env.VERIFIED_EMAILS || '21101045@usc.edu.ph').split(',').map(e => e.trim());

console.log('Using API key:', API_KEY.substring(0, 5) + '...');
console.log('Using from email:', FROM_EMAIL);
console.log('Verified emails:', VERIFIED_EMAILS.join(', '));
console.log('Mode:', process.env.NODE_ENV || 'development');

// Initialize Resend with API key
const resend = new Resend(API_KEY);

// Website URL for links in emails
const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';

/**
 * Send a password reset email to the user
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} resetToken - The password reset token
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendPasswordResetEmail = async (name, email, resetToken) => {
  try {
    // Ensure we're only sending to verified emails in development
    if (process.env.NODE_ENV !== 'production' && !VERIFIED_EMAILS.includes(email)) {
      console.log(`Cannot send to non-verified email: ${email} in development mode`);
      return { success: false, message: `Cannot send to non-verified email in dev mode. Allowed emails: ${VERIFIED_EMAILS.join(', ')}` };
    }

    // Create the reset link
    const resetLink = `${websiteUrl}/pages/reset-password.html?token=${resetToken}`;

    // Send the email
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Learn2Grow - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4a8fe7;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>Someone (hopefully you) has requested to reset the password for your Learn2Grow account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #4a8fe7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Your Password</a>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated email from Learn2Grow. Please do not reply to this email.</p>
        </div>
      `
    });

    console.log('Password reset email sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Process recipient registration - checks user status and sends appropriate email
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {boolean} isNewRequest - Whether this is a new registration request
 * @returns {Promise<Object>} - Response from Resend API
 */
export const processRecipientRegistration = async (name, email) => {
  try {
    // Check if user exists in the database
    const existingUser = await User.findOne({ email });
    const pendingRequest = await RecipientRequest.findOne({ 
      email, 
      status: 'pending' 
    });

    if (existingUser) {
      // User already exists, send notification
      return await sendExistingUserEmail(name, email);
    } else if (pendingRequest) {
      // User has a pending request, send notification
      return await sendPendingRequestEmail(name, email);
    } else {
      // New user, send verification email
      return await sendNewRecipientVerificationEmail(name, email);
    }
  } catch (error) {
    console.error('Error processing recipient registration email:', error);
    throw error;
  }
};

/**
 * Send a verification email to a new recipient
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendNewRecipientVerificationEmail = async (name, email) => {
  const subject = 'Welcome to Learn2Grow - Registration Received';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">Welcome to Learn2Grow!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering as a recipient with Learn2Grow. Your application has been received and is pending review by our admin team.</p>
      <p>We'll notify you once your application has been approved. This typically takes 1-2 business days.</p>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>If you have any questions, please reply to this email or contact support.</p>
      <p>Best regards,<br>The Learn2Grow Team</p>
      <div style="font-size: 12px; color: #999; margin-top: 20px;">
        <p>If you did not create an account, please ignore this email.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

/**
 * Send an email to a user who already has an account
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendExistingUserEmail = async (name, email) => {
  const subject = 'Learn2Grow - Account Already Exists';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">Account Already Exists</h2>
      <p>Hello ${name},</p>
      <p>We noticed you attempted to register with Learn2Grow, but an account with your email address already exists.</p>
      <p>If you've forgotten your password, you can reset it <a href="${websiteUrl}/forgot-password.html" style="color: #4CAF50; text-decoration: underline;">here</a>.</p>
      <p>If you didn't attempt to register, please ignore this email or contact support if you have concerns.</p>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>Best regards,<br>The Learn2Grow Team</p>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

/**
 * Send an email to a user who has a pending request
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendPendingRequestEmail = async (name, email) => {
  const subject = 'Learn2Grow - Registration Already Pending';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">Registration Already Pending</h2>
      <p>Hello ${name},</p>
      <p>We noticed you attempted to register with Learn2Grow again, but you already have a pending registration request.</p>
      <p>Our admin team is currently reviewing your application. We'll notify you once a decision has been made.</p>
      <p>If you have any questions about the status of your application, feel free to contact us.</p>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>Best regards,<br>The Learn2Grow Team</p>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

/**
 * Send an email to admin when a new recipient registers
 * @param {string} recipientName - New recipient's name
 * @param {string} recipientEmail - New recipient's email
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendRecipientRequestToAdmin = async (recipientName, recipientEmail) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set, cannot send admin notification');
    return null;
  }
  
  const subject = 'New Recipient Registration Request';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">New Recipient Registration</h2>
      <p>Hello Admin,</p>
      <p>A new recipient has registered on Learn2Grow and requires your approval:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${recipientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${recipientEmail}</td>
        </tr>
      </table>
      <p>Please log in to the admin dashboard to review this application.</p>
      <div style="margin: 20px 0;">
        <a href="${websiteUrl}/admin" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Admin Dashboard</a>
      </div>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>Best regards,<br>Learn2Grow System</p>
    </div>
  `;
  
  return await sendEmail(adminEmail, subject, html);
};

/**
 * Send an approval email to a recipient
 * @param {string} name - Recipient's name
 * @param {string} email - Recipient's email
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendRecipientApproval = async (name, email) => {
  const subject = 'Learn2Grow - Your Account Has Been Approved!';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">Account Approved!</h2>
      <p>Hello ${name},</p>
      <p>Great news! Your Learn2Grow recipient account has been approved by our admin team.</p>
      <p>You can now log in to your account and access all recipient features:</p>
      <div style="margin: 20px 0;">
        <a href="${websiteUrl}/login" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Log in to Your Account</a>
      </div>
      <p>As a recipient, you can now:</p>
      <ul style="padding-left: 20px; line-height: 1.5;">
        <li>Create posts to share your needs</li>
        <li>Upload your GCash QR code</li>
        <li>Receive donations from sponsors</li>
        <li>Communicate with sponsors</li>
      </ul>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>If you need any assistance, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The Learn2Grow Team</p>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

/**
 * Send a rejection email to a recipient
 * @param {string} name - Recipient's name
 * @param {string} email - Recipient's email
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendRecipientRejection = async (name, email, reason) => {
  const subject = 'Learn2Grow - Regarding Your Application';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">Application Update</h2>
      <p>Hello ${name},</p>
      <p>Thank you for your interest in joining Learn2Grow as a recipient.</p>
      <p>After careful review, we're unable to approve your application at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this decision was made in error or if you have additional information that might help with your application, please feel free to contact us.</p>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>Best regards,<br>The Learn2Grow Team</p>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

/**
 * Generic function to send an email using Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendEmail = async (to, subject, html) => {
  try {
    if (!resend) {
      console.warn('Resend not initialized. Email not sent.');
      return { id: null, message: 'Email service not initialized' };
    }

    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = 'Learn2Grow';
    const fromField = `${fromName} <${fromEmail}>`;
    
    // Determine if we're in development/testing mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Get all verified emails (for testing with multiple emails)
    const verifiedEmails = (process.env.VERIFIED_EMAILS || '21101045@usc.edu.ph').split(',').map(e => e.trim());
    
    // Check if recipient email is in verified list
    let targetEmail = to;
    let isRedirected = false;
    
    // In dev mode with free Resend tier, we can only send to verified emails
    if (isDevelopment) {
      // If recipient is not a verified email, redirect to the first verified email
      if (!verifiedEmails.includes(to)) {
        targetEmail = verifiedEmails[0];
        isRedirected = true;
        
        // Display user-friendly console message about redirection
        console.log('\n🔔 EMAIL REDIRECTION NOTICE 🔔');
        console.log(`⚠️  Email to ${to} is being redirected to ${targetEmail}`);
        console.log('💡 This is because Resend free tier only allows sending to verified emails');
        console.log('💡 Your request was processed successfully, but the email is going to a test account');
        console.log('💡 To send to real addresses, wait for domain verification to complete');
        console.log('✅ To verify more emails, run: node verify-email.js\n');
      }
    }
    
    console.log('Attempting to send email with Resend:');
    console.log('- From:', fromField);
    console.log('- To:', targetEmail, isRedirected ? `(redirected from ${to})` : '');
    console.log('- Subject:', subject);
    
    // Add original recipient info to subject when redirecting
    const finalSubject = isRedirected 
      ? `${subject} [Originally for: ${to}]` 
      : subject;
    
    const data = await resend.emails.send({
      from: fromField,
      to: [targetEmail], // Ensure to is an array as per Resend docs
      subject: finalSubject,
      html: isRedirected
        ? `<div style="background-color: #f8f9fa; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">
            <p><strong>TEST MODE:</strong> This email was originally intended for: <strong>${to}</strong></p>
          </div>${html}`
        : html
    });
    
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    throw error;
  }
};

// Export default object with all functions
export default {
  processRecipientRegistration,
  sendNewRecipientVerificationEmail,
  sendExistingUserEmail,
  sendPendingRequestEmail,
  sendRecipientRequestToAdmin,
  sendRecipientApproval,
  sendRecipientRejection,
  sendEmail
};
