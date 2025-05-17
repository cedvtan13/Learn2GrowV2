// utils/emailService.js
import nodemailer from 'nodemailer';

// Create a transporter for sending emails
// In production, use real SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASS || 'your-password'
  }
});

// For development, log email content instead of sending
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Send an email to the admin when a new recipient request is received
 * @param {string} name - The name of the recipient
 * @param {string} email - The email of the recipient
 */
export const sendRecipientRequestToAdmin = async (name, email) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@learn2grow.org';
    
    const mailOptions = {
      from: `"Learn2Grow" <${process.env.EMAIL_USER || 'noreply@learn2grow.org'}>`,
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
      from: `"Learn2Grow" <${process.env.EMAIL_USER || 'noreply@learn2grow.org'}>`,
      to: email,
      subject: 'Thank You for Your Learn2Grow Application',
      html: `
        <h2>Thank You for Applying, ${name}!</h2>
        <p>We've received your request to join Learn2Grow as a Recipient.</p>
        <p>Our team will review your application and get back to you within 2-3 business days. 
           This review process helps us ensure that our platform continues to serve those who need it most.</p>
        <p>In the meantime, if you have any questions, please don't hesitate to contact us at 
           <a href="mailto:support@learn2grow.org">support@learn2grow.org</a>.</p>
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

export default {
  sendRecipientRequestToAdmin,
  sendRecipientConfirmation
};
