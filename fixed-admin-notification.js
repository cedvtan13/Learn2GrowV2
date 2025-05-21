// fixed-admin-notification.js
// This file replaces the sendRecipientRequestToAdmin function in emailJSService.js
// with a direct HTML implementation to avoid template issues

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config();

// Environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@learn2grow.org';
const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
const adminEmail = process.env.ADMIN_EMAIL || 'cedv.tan@gmail.com';

// Create a nodemailer transporter
let transporter = null;
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
    console.log('Email transport initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email transport:', error);
    transporter = null;
  }
} else {
  console.warn('Email credentials missing. Unable to send emails.');
}

/**
 * Send a direct admin notification email with proper formatting
 */
async function sendDirectAdminNotification() {
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set, cannot send admin notification');
    return null;
  }

  if (!transporter) {
    console.error('Email transport not initialized, cannot send email');
    return null;
  }
  
  const recipientName = 'Test Recipient';
  const recipientEmail = 'testrecipient@example.com';
  
  // Create HTML content directly
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
      </table>      <p>Please log in to the admin dashboard to review this application.</p>
      <div style="margin: 20px 0;">
        <a href="${websiteUrl}/admin.html" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Admin Dashboard</a>
      </div>
      <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
      <p>Best regards,<br>Learn2Grow System</p>
    </div>
  `;
  
  try {
    console.log('Sending admin notification directly via nodemailer');
    console.log('From:', `Learn2Grow <${FROM_EMAIL}>`);
    console.log('To:', adminEmail);
    console.log('Subject:', subject);
    
    const mailOptions = {
      from: `Learn2Grow <${FROM_EMAIL}>`,
      to: adminEmail,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification sent successfully:', info.messageId);
    
    // Save a copy to the logs
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `admin-notification-direct-${timestamp}.html`;
    const emailDir = path.join(process.cwd(), 'email-logs');
    
    if (!fs.existsSync(emailDir)) {
      fs.mkdirSync(emailDir, { recursive: true });
    }
    
    const filePath = path.join(emailDir, filename);
    fs.writeFileSync(filePath, html);
    console.log(`Admin notification saved to: ${filePath}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: error.message };
  }
}

// Run the function
sendDirectAdminNotification()
  .then(result => console.log('Result:', result))
  .catch(err => console.error('Error:', err));
