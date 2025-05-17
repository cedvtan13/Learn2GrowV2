// utils/emailService.js
import nodemailer from 'nodemailer';

// Create a transporter for sending emails
// In production, use real SMTP credentials
const createTransporter = () => {
  // Load environment variables directly
  const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
  const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true' || false;
  const EMAIL_USER = process.env.EMAIL_USER || 'learn2growad1@gmail.com';
  const EMAIL_PASS = process.env.EMAIL_PASS;
  
  console.log('📧 Setting up email transporter with:');
  const config = {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  };
  
  // Log the config without the password for security
  console.log({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.auth.user, pass: '****' }
  });
  
  return nodemailer.createTransport(config);
};

const transporter = createTransporter();

// For development, log email content instead of sending
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV !== 'production';
console.log(`📧 Email mode: ${isDevelopment ? 'Development (logs only)' : 'Production (sending)'}`);
console.log(`📧 NODE_ENV: ${NODE_ENV}`);

/**
 * Send an email to the admin when a new recipient request is received
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
export const sendRecipientRequestToAdmin = async (name, email) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'learn2growad1@gmail.com';
    
    const mailOptions = {
      from: `"Learn2Grow" <${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}>`,
      to: adminEmail,
      subject: 'New Recipient Registration Request',
      html: `
        <h2>New Recipient Registration Request</h2>
        <p>A new user has requested to join Learn2Grow as a Recipient:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p>Please review this request and approve or deny it through the admin portal.</p>
        <p>Thank you,<br/>Learn2Grow Team</p>
      `
    };
    
    if (isDevelopment) {
      console.log('📧 Development Mode - Email would be sent to admin:');
      console.log(mailOptions);
      return true;
    } else {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to admin: ${info.messageId}`);
      return true;
    }
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
};

/**
 * Send a confirmation email to the user who requested to be a recipient
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
export const sendRecipientConfirmation = async (name, email) => {
  try {
    const mailOptions = {
      from: `"Learn2Grow" <${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}>`,
      to: email,
      subject: 'Thank You for Your Learn2Grow Application',
      html: `
        <h2>Thank You for Applying, ${name}!</h2>
        <p>We've received your request to join Learn2Grow as a Recipient.</p>
        <p>Our team will review your application and get back to you within 2-3 business days. 
           This review process helps us ensure that our platform continues to serve those who need it most.</p>        <p>In the meantime, if you have any questions, please don't hesitate to contact us at
           <a href="mailto:learn2growad1@gmail.com">learn2growad1@gmail.com</a>.</p>
        <p>Best regards,<br/>The Learn2Grow Team</p>
      `
    };
    
    if (isDevelopment) {
      console.log('📧 Development Mode - Email would be sent to user:');
      console.log(mailOptions);
      return true;
    } else {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to user: ${info.messageId}`);
      return true;
    }
  } catch (error) {
    console.error('Error sending user confirmation email:', error);
    return false;
  }
};

/**
 * Send an approval email to the user whose recipient status was approved
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
export const sendRecipientApproval = async (name, email) => {
  try {
    const mailOptions = {
      from: `"Learn2Grow" <${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}>`,
      to: email,
      subject: 'Your Learn2Grow Application is Approved!',
      html: `
        <h2>Congratulations, ${name}!</h2>
        <p>We're pleased to inform you that your application to join Learn2Grow as a Recipient has been approved.</p>
        <p>You can now log in to your account using the email and password you provided during registration.</p>
        <p>Once logged in, you'll have access to all the resources and support available through our platform.</p>        <p>If you have any questions or need assistance getting started, please don't hesitate to contact us at 
           <a href="mailto:learn2growad1@gmail.com">learn2growad1@gmail.com</a>.</p>
        <p>Welcome to the Learn2Grow community!</p>
        <p>Best regards,<br/>The Learn2Grow Team</p>
      `
    };
    
    if (isDevelopment) {
      console.log('📧 Development Mode - Approval email would be sent to user:');
      console.log(mailOptions);
      return true;
    } else {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Approval email sent to user: ${info.messageId}`);
      return true;
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
};

/**
 * Send a verification email to the user to confirm their recipient eligibility
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 * @param {string} notes - Optional notes about required verification steps
 */
export const sendRecipientVerification = async (name, email, notes = '') => {
  try {
    const mailOptions = {
      from: `"Learn2Grow" <${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}>`,
      to: email,
      subject: 'Learn2Grow: Recipient Registration - Verification Required',
      html: `
        <h2>Dear ${name},</h2>
        <p>Thank you for registering with Learn2Grow as a potential Recipient! We're excited about the possibility of supporting your growth journey.</p>
        <p><strong>Your registration has been received, but requires verification.</strong> To complete the process, we need some additional information to verify your eligibility for our sponsorship program.</p>
        ${notes ? `<p><strong>Required Information:</strong> ${notes}</p>` : ''}
        <p>To proceed with the verification process, please:</p>
        <ol>
          <li>Prepare documents that verify your eligibility (these might include proof of enrollment in educational programs, financial information, or other relevant documentation)</li>
          <li>Reply directly to this email with the requested information attached</li>
          <li>Our verification team will review your submission and respond within 2-3 business days</li>
        </ol>
        <p>If you have any questions about the verification process or need assistance, please contact our support team at <a href="mailto:learn2growad1@gmail.com">learn2growad1@gmail.com</a>.</p>
        <p>Thank you for your interest in Learn2Grow. We look forward to welcoming you to our community!</p>
        <p>Sincerely,<br/>The Learn2Grow Team</p>
      `
    };
    
    if (isDevelopment) {
      console.log('📧 Development Mode - Verification email would be sent to user:');
      console.log(mailOptions);
      return true;
    } else {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Verification email sent to user: ${info.messageId}`);
      return true;
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export default {
  sendRecipientRequestToAdmin,
  sendRecipientConfirmation,
  sendRecipientApproval,
  sendRecipientVerification
};
