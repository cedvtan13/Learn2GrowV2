// utils/emailJSService.js
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import RecipientRequest from '../models/recipientRequestModel.js';
import nodemailer from 'nodemailer';

dotenv.config();

// Environment variables for email configuration
const USER_ID = process.env.EMAILJS_USER_ID || 'your_emailjs_user_id';
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'your_emailjs_service_id';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@learn2grow.org';

// Template IDs (for reference to the EmailJS templates)
const TEMPLATES = {
  RECIPIENT_VERIFICATION: 'template_verification',
  EXISTING_USER: 'template_existing_user',
  PENDING_REQUEST: 'template_pending',
  ADMIN_NOTIFICATION: 'template_admin_notify',
  RECIPIENT_APPROVAL: 'template_approval',
  RECIPIENT_REJECTION: 'template_rejection',
  PASSWORD_RESET: 'template_password_reset'
};

// Environment variables
const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
const adminEmail = process.env.ADMIN_EMAIL || 'cedv.tan@gmail.com';

console.log('Environment check for Email Service:');
console.log('Using Email Host:', EMAIL_HOST);
console.log('Using Email User:', EMAIL_USER ? 'Found' : 'Missing');
console.log('Service ID (for template reference):', SERVICE_ID);
console.log('Website URL:', websiteUrl);
console.log('Admin Email:', adminEmail);

// Create a nodemailer transporter
let transporter = null;
let transportMode = 'console';

// Check if we have email credentials
if (EMAIL_USER && EMAIL_PASSWORD) {
  try {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
    transportMode = 'nodemailer';
    console.log('Email transport initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email transport:', error);
    console.warn('Email service will use console logging instead.');
    transportMode = 'console';
    transporter = null;
  }
} else {
  console.warn('Email credentials missing. Email service will use console logging instead.');
}

/**
 * Send a password reset email to the user
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} resetToken - The password reset token
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendPasswordResetEmail = async (name, email, resetToken) => {
  try {
    const resetLink = `${websiteUrl}/reset-password.html?token=${resetToken}`;
    
    const templateParams = {
      to_name: name,
      to_email: email,
      reset_link: resetLink,
      website_url: websiteUrl
    };
    
    const response = await sendEmail(TEMPLATES.PASSWORD_RESET, templateParams);
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
 * @returns {Promise<Object>} - Response from EmailJS
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
      // Generate a verification token (valid for 24 hours)
      const jwt = (await import('jsonwebtoken')).default;
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '24h' }
      );
      
      // New user, send verification email with token
      return await sendNewRecipientVerificationEmail(name, email, verificationToken);
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
 * @param {string} verificationToken - The verification token
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendNewRecipientVerificationEmail = async (name, email, verificationToken) => {
  try {
    const verificationLink = `${websiteUrl}/api/users/verify-email?token=${verificationToken}`;
    
    // ALWAYS use the direct email method regardless of transport mode
    // This ensures we don't use the EmailJS template that may have old content
    const subject = 'Learn2Grow - Verify Your Email Address';
    
    // Create HTML email content directly
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">Verify Your Email Address</h2>        <p>Hello ${name},</p>
        <p>Thank you for registering with Learn2Grow. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
        </div>
        <p>This verification link will expire in 24 hours.</p>
        <p>Once you verify your email, your account will be automatically activated and you can start using Learn2Grow immediately!</p>
        <p>If you're unable to click the button, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 12px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
        <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>The Learn2Grow Team</p>
      </div>
    `;
    
    if (transportMode === 'nodemailer' && transporter) {
      // Send the email directly via nodemailer
      const mailOptions = {
        from: `Learn2Grow <${FROM_EMAIL}>`,
        to: email,
        subject,
        html: htmlContent
      };
      
      console.log('Sending verification email directly via nodemailer');
      const info = await transporter.sendMail(mailOptions);
      console.log('Direct verification email sent successfully:', info.messageId);
      
      // Save a copy of the email to the logs
      try {
        const fs = await import('fs');
        const path = await import('path');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `verification-email-${timestamp}.html`;
        const emailDir = path.join(process.cwd(), 'email-logs');
        
        if (!fs.existsSync(emailDir)) {
          fs.mkdirSync(emailDir, { recursive: true });
        }
        
        const filePath = path.join(emailDir, filename);
        fs.writeFileSync(filePath, htmlContent);
        console.log(`Verification email saved to: ${filePath}`);
      } catch (logError) {
        console.error('Failed to save email log:', logError);
      }
      
      return { data: info, error: null };
    } else {
      // For console output or if nodemailer isn't configured
      console.log('\n============ VERIFICATION EMAIL CONTENT ============');
      console.log(`FROM: Learn2Grow <${FROM_EMAIL}>`);
      console.log(`TO: ${email}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`CONTENT: ${htmlContent.substring(0, 100)}...`);
      console.log('=======================================\n');
      
      return { 
        success: true, 
        message: 'Email logged to console (no email transport configured)'
      };
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send an email to a user who already has an account
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendExistingUserEmail = async (name, email) => {
  const templateParams = {
    to_name: name,
    to_email: email,
    website_url: websiteUrl
  };
  
  return await sendEmail(TEMPLATES.EXISTING_USER, templateParams);
};

/**
 * Send an email to a user who has a pending request
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendPendingRequestEmail = async (name, email) => {
  const templateParams = {
    to_name: name,
    to_email: email,
    website_url: websiteUrl
  };
  
  return await sendEmail(TEMPLATES.PENDING_REQUEST, templateParams);
};

/**
 * Send an email to admin when a new recipient registers
 * @param {string} recipientName - New recipient's name
 * @param {string} recipientEmail - New recipient's email
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendRecipientRequestToAdmin = async (recipientName, recipientEmail) => {
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set, cannot send admin notification');
    return null;
  }
  
  const templateParams = {
    admin_email: adminEmail,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    website_url: websiteUrl
  };
  
  return await sendEmail(TEMPLATES.ADMIN_NOTIFICATION, templateParams);
};

/**
 * Send an approval email to a recipient
 * @param {string} name - Recipient's name
 * @param {string} email - Recipient's email
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendRecipientApproval = async (name, email) => {
  const templateParams = {
    to_name: name,
    to_email: email,
    website_url: websiteUrl
  };
  
  return await sendEmail(TEMPLATES.RECIPIENT_APPROVAL, templateParams);
};

/**
 * Send a rejection email to a recipient
 * @param {string} name - Recipient's name
 * @param {string} email - Recipient's email
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendRecipientRejection = async (name, email, reason) => {
  const templateParams = {
    to_name: name,
    to_email: email,
    rejection_reason: reason || 'No specific reason provided',
    website_url: websiteUrl
  };
  
  return await sendEmail(TEMPLATES.RECIPIENT_REJECTION, templateParams);
};

/**
 * Generic function to send an email using Nodemailer
 * @param {string} templateId - Template ID for reference (not used with Nodemailer)
 * @param {Object} templateParams - Parameters for the email content
 * @returns {Promise<Object>} - Response from the email sending operation
 */
export const sendEmail = async (templateId, templateParams) => {
  try {
    const toEmail = templateParams.to_email || templateParams.admin_email;
    console.log('Attempting to send email:');
    console.log('- Template Reference:', templateId);
    console.log('- To:', toEmail);

    // If running in development, check if we should redirect emails
    const { targetEmail, isRedirected } = handleEmailRedirection(toEmail);
    
    // Generate email content based on template ID and params
    const { subject, html } = generateEmailContent(templateId, templateParams, isRedirected, toEmail);
    
    // Determine how to handle the email based on available transport options
    if (transportMode === 'nodemailer' && transporter) {
      // Send using Nodemailer
      const mailOptions = {
        from: `Learn2Grow <${FROM_EMAIL}>`,
        to: targetEmail,
        subject,
        html
      };
      
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { data: info, error: null };
      } catch (emailError) {
        console.error('Failed to send email using transporter:', emailError);
        console.log('Falling back to console logging...');
        // Fall back to console logging if sending fails
        transportMode = 'console';
        // Continue to console logging below...
      }
    }
    
    // Console logging as fallback or primary method if no transporter
    console.log('\n============ EMAIL CONTENT ============');
    console.log(`FROM: Learn2Grow <${FROM_EMAIL}>`);
    console.log(`TO: ${targetEmail}${isRedirected ? ` (redirected from ${toEmail})` : ''}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT: ${html.substring(0, 100)}...`);
    console.log('=======================================\n');
    
    // Create a file with the email content for reference
    try {
      const fs = await import('fs');
      const path = await import('path');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `email-${timestamp}.html`;
      const emailDir = path.join(process.cwd(), 'email-logs');
      
      // Create the directory if it doesn't exist
      if (!fs.existsSync(emailDir)) {
        fs.mkdirSync(emailDir, { recursive: true });
      }
      
      // Write the email content to a file
      const filePath = path.join(emailDir, filename);
      const emailContent = `
        <!-- Email Log -->
        <html>
        <head>
          <title>Email Log - ${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .meta { background: #f5f5f5; padding: 10px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="meta">
            <p><strong>From:</strong> Learn2Grow &lt;${FROM_EMAIL}&gt;</p>
            <p><strong>To:</strong> ${targetEmail}${isRedirected ? ` (redirected from ${toEmail})` : ''}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Date:</strong> ${new Date().toString()}</p>
          </div>
          <div class="content">
            ${html}
          </div>
        </body>
        </html>
      `;
      
      fs.writeFileSync(filePath, emailContent);
      console.log(`Email content saved to ${filePath}`);
    } catch (fsError) {
      console.log('Could not save email to file:', fsError.message);
    }
    
    return { 
      data: { 
        messageId: 'console-log-only',
        emailContent: html,
        subject,
        to: targetEmail
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { data: null, error: error };
  }
};

/**
 * Helper function to check if we need to redirect emails in development mode
 * @param {string} to - Original recipient email
 * @returns {Object} - targetEmail and isRedirected flag
 */
const handleEmailRedirection = (to) => {
  // Determine if we're in development/testing mode
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Get verified emails for testing
  const verifiedEmails = (process.env.VERIFIED_EMAILS || '21101045@usc.edu.ph').split(',').map(e => e.trim());
  
  // Check if recipient email is in verified list
  let targetEmail = to;
  let isRedirected = false;
  
  // In dev mode, we might want to redirect emails to a verified address
  if (isDevelopment) {
    if (!verifiedEmails.includes(to)) {
      targetEmail = verifiedEmails[0];
      isRedirected = true;
      
      // Display user-friendly console message about redirection
      console.log('\n🔔 EMAIL REDIRECTION NOTICE 🔔');
      console.log(`⚠️  Email to ${to} is being redirected to ${targetEmail}`);
      console.log('💡 This is for testing purposes in development mode');
      console.log('💡 Your request was processed successfully, but the email is going to a test account');
      console.log('✅ To update verified test emails, modify the VERIFIED_EMAILS env variable\n');
    }
  }
  
  return { targetEmail, isRedirected };
};

/**
 * Generate email content based on template ID and parameters
 * @param {string} templateId - Template ID reference
 * @param {Object} params - Parameters for the email content
 * @param {boolean} isRedirected - Whether the email is being redirected
 * @param {string} originalEmail - Original recipient email if redirected
 * @returns {Object} - Subject and HTML content for the email
 */
const generateEmailContent = (templateId, params, isRedirected = false, originalEmail = null) => {  // Add redirection notice if needed
  const redirectNotice = isRedirected 
    ? `<div style="background-color: #f8f9fa; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">
        <p><strong>TEST MODE:</strong> This email was originally intended for: <strong>${originalEmail}</strong></p>
      </div>`
    : '';
  
  let subject = '';
  let content = '';
  
  // Generate content based on template ID
  switch (templateId) {
    case TEMPLATES.PASSWORD_RESET:
      subject = 'Learn2Grow - Password Reset';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          ${redirectNotice}
          <h2 style="color: #4a8fe7;">Password Reset Request</h2>
          <p>Hello ${params.to_name},</p>
          <p>Someone (hopefully you) has requested to reset the password for your Learn2Grow account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${params.reset_link}" style="display: inline-block; background-color: #4a8fe7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Your Password</a>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated email from Learn2Grow. Please do not reply to this email.</p>
        </div>
      `;
      break;
        case TEMPLATES.RECIPIENT_VERIFICATION:
      subject = 'Learn2Grow - Verify Your Email Address';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">Verify Your Email Address</h2>
          <p>Hello ${params.to_name},</p>
          <p>Thank you for registering with Learn2Grow. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.verification_link}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
          </div>
          <p>This verification link will expire in 24 hours.</p>
          <p>After verifying your email, your application will be submitted for review by our admin team. We'll notify you once your application has been approved.</p>
          <p>If you're unable to click the button, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${params.verification_link}</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `;
      break;
    
    case TEMPLATES.EXISTING_USER:
      subject = 'Learn2Grow - Account Already Exists';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">Account Already Exists</h2>
          <p>Hello ${params.to_name},</p>
          <p>We noticed you attempted to register with Learn2Grow, but an account with your email address already exists.</p>
          <p>If you've forgotten your password, you can reset it <a href="${params.website_url}/forgot-password.html" style="color: #4CAF50; text-decoration: underline;">here</a>.</p>
          <p>If you didn't attempt to register, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `;
      break;
      
    case TEMPLATES.PENDING_REQUEST:
      subject = 'Learn2Grow - Registration Already Pending';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">Registration Already Pending</h2>
          <p>Hello ${params.to_name},</p>
          <p>We noticed you attempted to register with Learn2Grow again, but you already have a pending registration request.</p>
          <p>Our admin team is currently reviewing your application. We'll notify you once a decision has been made.</p>
          <p>If you have any questions about the status of your application, feel free to contact us.</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `;
      break;
      
    case TEMPLATES.ADMIN_NOTIFICATION:
      subject = 'New Recipient Registration Request';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">New Recipient Registration</h2>
          <p>Hello Admin,</p>
          <p>A new recipient has registered on Learn2Grow and requires your approval:</p>      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${params.recipient_name}</td>
            </tr>        <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${params.recipient_email}</td>
            </tr>          </table>          <p>Your recipient has been automatically approved in the system.</p>
          <div style="margin: 20px 0;">
            <a href="${params.website_url}/admin.html" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Homepage</a>
          </div>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>Learn2Grow System</p>
        </div>
      `;
      break;
      
    case TEMPLATES.RECIPIENT_APPROVAL:
      subject = 'Learn2Grow - Your Account Has Been Approved!';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">Account Approved!</h2>
          <p>Hello ${params.to_name},</p>
          <p>Great news! Your Learn2Grow recipient account has been approved by our admin team.</p>          <p>You can now log in to your account and access all recipient features:</p>
          <div style="margin: 20px 0;">
        <a href="${params.website_url}/index.html" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Log in to Your Account</a>
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
      break;
      
    case TEMPLATES.RECIPIENT_REJECTION:
      subject = 'Learn2Grow - Regarding Your Application';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">Application Update</h2>
          <p>Hello ${params.to_name},</p>
          <p>Thank you for your interest in joining Learn2Grow as a recipient.</p>
          <p>After careful review, we're unable to approve your application at this time.</p>
          <p><strong>Reason:</strong> ${params.rejection_reason || 'No specific reason provided.'}</p>
          <p>If you believe this decision was made in error or if you have additional information that might help with your application, please feel free to contact us.</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `;
      break;
    
    default:
      subject = 'Message from Learn2Grow';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${redirectNotice}
          <h2 style="color: #4CAF50;">Learn2Grow Notification</h2>
          <p>Hello ${params.to_name || 'User'},</p>
          <p>This is a notification from the Learn2Grow platform.</p>
          <p>For more details, please visit our website.</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `;
  }
  
  return { subject, html: content };
  
  // Add original recipient to subject if redirected
  const finalSubject = isRedirected 
    ? `${subject} [Originally for: ${originalEmail}]` 
    : subject;
  
  return { subject: finalSubject, html: content };
};

// Export default object with all functions
export default {
  sendPasswordResetEmail,
  processRecipientRegistration,
  sendNewRecipientVerificationEmail,
  sendExistingUserEmail,
  sendPendingRequestEmail,
  sendRecipientRequestToAdmin,
  sendRecipientApproval,
  sendRecipientRejection,
  sendEmail
};
