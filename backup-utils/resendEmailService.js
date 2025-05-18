// utils/resendEmailService.js
import { Resend } from 'resend';
import User from '../models/userModel.js';
import RecipientRequest from '../models/recipientRequestModel.js';

// Check for required environment variables
console.log(' Environment check for Resend:');
if (!process.env.RESEND_API_KEY) {
  console.warn('  RESEND_API_KEY is not set. Email sending through Resend will not work.');
} else {
  console.log(' RESEND_API_KEY is set');
}

if (!process.env.FROM_EMAIL) {
  console.warn('  FROM_EMAIL is not set. Using default: noreply@learn2grow.org');
} else {
  console.log(' FROM_EMAIL is set to:', process.env.FROM_EMAIL);
}

// Initialize Resend with your API key or a placeholder in development mode
const apiKey = process.env.RESEND_API_KEY || 'placeholder_for_development';
// Only initialize Resend if we have a valid API key (not the placeholder)
const resend = apiKey !== 'placeholder_for_development' ? new Resend(apiKey) : null;

// Check the environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// For backward compatibility with `emailService.js`
export const sendRecipientRequestToAdmin = async (name, email) => {
  const subject = 'New Recipient Registration Request';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50;">Learn2Grow</h1>
        <p style="font-size: 18px; color: #666;">New Recipient Registration</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">New Registration Request</h2>
        <p>A new user has requested to join Learn2Grow as a Recipient:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p>Please review this request and approve or deny it through the admin portal.</p>
      </div>
      
      <div style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
        <p>Thank you for maintaining our community standards.</p>
        <p>The Learn2Grow Team</p>
      </div>
    </div>
  `;
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@learn2grow.org';
  return await sendEmail(adminEmail, subject, htmlContent);
};

export const sendRecipientConfirmation = async (name, email) => {
  return await sendNewRegistrationEmail(name, email);
};

// For the admin approval functionality
export const sendRecipientApproval = async (name, email) => {
  const subject = 'Learn2Grow - Your Registration Has Been Approved';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50;">Learn2Grow</h1>
        <p style="font-size: 18px; color: #666;">Registration Approved!</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
        <p>Great news! Your request to join Learn2Grow as a Recipient has been approved.</p>
        <p>You can now log in to your account and start sharing your story with potential sponsors.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.WEBSITE_URL || 'https://learn2grow.org'}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Log In to Your Account
        </a>
      </div>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin-top: 0;"><strong>Need help?</strong> If you have any questions about using our platform, please visit our Help Center or contact our support team.</p>
      </div>
      
      <div style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
        <p>Welcome to our community!</p>
        <p>The Learn2Grow Team</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, htmlContent);
};

// For admin rejection functionality
export const sendRecipientRejection = async (name, email, reason = '') => {
  const subject = 'Learn2Grow - Registration Status Update';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50;">Learn2Grow</h1>
        <p style="font-size: 18px; color: #666;">Registration Status Update</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
        <p>Thank you for your interest in joining Learn2Grow as a Recipient.</p>
        <p>After careful review, we regret to inform you that we are unable to approve your registration at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      
      <div style="background-color: #fdf2e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin-top: 0;"><strong>Questions?</strong> If you believe this decision was made in error or would like more information, please contact our support team.</p>
      </div>
      
      <div style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
        <p>Thank you for your understanding.</p>
        <p>The Learn2Grow Team</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, htmlContent);
};

/**
 * Process new recipient registration and send appropriate verification email
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 * @param {string} hashedPassword - The hashed password for the new user
 * @returns {Object} Result of the operation including success status and message
 */
export const processRecipientRegistration = async (name, email, hashedPassword) => {
  try {
    // Check if the email exists in either Users or RecipientRequests collections
    const existingUser = await User.findOne({ email });
    const existingRequest = await RecipientRequest.findOne({ email });
    
    if (existingUser) {
      // User already exists in the main Users collection
      await sendAlreadyRegisteredEmail(name, email);
      return {
        success: true,
        isNewUser: false,
        message: 'Email sent to already registered user'
      };
    } else if (existingRequest) {
      // Request already exists but not yet approved
      await sendPendingVerificationEmail(name, email);
      return {
        success: true,
        isNewUser: false,
        isPending: true,
        message: 'Email sent to user with pending registration'
      };
    } else {
      // New registration - save to RecipientRequest and send verification
      const request = await RecipientRequest.create({
        name,
        email,
        password: hashedPassword,
        status: 'pending'
      });
      
      await sendNewRegistrationEmail(name, email);
      await sendRecipientRequestToAdmin(name, email);
      
      return {
        success: true,
        isNewUser: true,
        requestId: request._id,
        message: 'New registration processed and verification email sent'
      };
    }
  } catch (error) {
    console.error('Error in recipient registration process:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to process registration'
    };
  }
};

/**
 * Send verification email to new recipient
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
async function sendNewRegistrationEmail(name, email) {
  const subject = 'Welcome to Learn2Grow - Verify Your Recipient Registration';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50;">Learn2Grow</h1>
        <p style="font-size: 18px; color: #666;">Thank you for registering as a recipient!</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
        <p>Thank you for registering with Learn2Grow as a recipient. We're excited to have you join our community!</p>
        <p>Your registration is currently under review by our team. This process typically takes 1-2 business days.</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333;">Next Steps:</h3>
        <ol style="color: #555; line-height: 1.5;">
          <li>Our team will review your application</li>
          <li>You'll receive an approval email once verified</li>
          <li>After approval, you can log in and start sharing your story</li>
        </ol>
      </div>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin-top: 0;"><strong>Note:</strong> If you need to provide additional information or have questions, please reply to this email.</p>
      </div>
      
      <div style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
        <p>Thank you for being part of our mission to make a difference.</p>
        <p>The Learn2Grow Team</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, htmlContent);
}

/**
 * Send email to already registered user
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
async function sendAlreadyRegisteredEmail(name, email) {
  const subject = 'Learn2Grow - You\'re Already Registered';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50;">Learn2Grow</h1>
        <p style="font-size: 18px; color: #666;">Account Already Active</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
        <p>We noticed you tried to register as a recipient with Learn2Grow, but this email is already registered in our system.</p>
        <p>You can log in using your existing credentials. If you've forgotten your password, you can use the password reset option on the login page.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.WEBSITE_URL || 'https://learn2grow.org'}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Log In to Your Account
        </a>
      </div>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin-top: 0;"><strong>Need help?</strong> If you didn't attempt to register or have any questions, please contact our support team.</p>
      </div>
      
      <div style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
        <p>Thank you for being part of our mission to make a difference.</p>
        <p>The Learn2Grow Team</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, htmlContent);
}

/**
 * Send email to user with pending registration
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
async function sendPendingVerificationEmail(name, email) {
  const subject = 'Learn2Grow - Your Registration is Still Under Review';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50;">Learn2Grow</h1>
        <p style="font-size: 18px; color: #666;">Registration Status Update</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
        <p>We noticed you've submitted another registration request, but your previous registration is still under review by our team.</p>
        <p>Please be patient as we process your application. This typically takes 1-2 business days.</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin-top: 0;"><strong>Already approved?</strong> If you believe your registration should already be approved, please try logging in again or contact our support team.</p>
      </div>
      
      <div style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
        <p>Thank you for your patience and for being part of our community.</p>
        <p>The Learn2Grow Team</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, htmlContent);
}

/**
 * Generic function to send email via Resend API
 * @param {string} to - The recipient's email address
 * @param {string} subject - The email subject
 * @param {string} html - The HTML content of the email
 */
async function sendEmail(to, subject, html) {
  try {
    // In development mode, just log the email instead of sending it
    // Unless FORCE_SEND_EMAILS is set to true
    if (isDevelopment && process.env.FORCE_SEND_EMAILS !== 'true') {
      console.log(' Development Mode - Email would be sent:');
      console.log({
        to,
        subject,
        preview: html.substring(0, 150) + '...'
      });
      return { success: true, id: 'dev-mode-email' };
    }
    
    // Check if we have a valid Resend API key
    if (!resend) {
      console.log(' No valid API key - Email would be sent in production mode:');
      console.log({
        to,
        subject,
        preview: html.substring(0, 150) + '...'
      });
      return { success: true, id: 'missing-api-key-email' };
    }
    
    // In production or if FORCE_SEND_EMAILS is true, send the email using Resend API
    const { data, error } = await resend.emails.send({
      from: `Learn2Grow <${process.env.FROM_EMAIL || 'noreply@learn2grow.org'}>`,
      to,
      subject,
      html
    });
    
    if (error) {
      console.error('Error sending email via Resend:', error);
      throw new Error(error.message);
    }
    
    console.log(` Email sent via Resend: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

export default {
  processRecipientRegistration,
  sendRecipientRequestToAdmin,
  sendRecipientConfirmation,
  sendRecipientApproval,
  sendRecipientRejection
};
