// testRealEmail.js - Send a real email using Gmail SMTP
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function sendTestEmail() {
  console.log('🔄 Starting real email test with Gmail SMTP...');
  
  // Create transporter with Gmail settings
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'learn2growad1@gmail.com',
      pass: process.env.EMAIL_PASS
    }
  });

  console.log(`Using email: learn2growad1@gmail.com`);
  console.log(`Password from .env: ${process.env.EMAIL_PASS ? '(set)' : '(not set)'}`);

  // Email content
  const mailOptions = {
    from: '"Learn2Grow" <learn2growad1@gmail.com>',
    to: 'learn2growad1@gmail.com',
    subject: 'Test Email from Learn2Grow',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email from Learn2Grow's automated email system.</p>
      <p>If you've received this email, the email system is working correctly!</p>
      <p>Best regards,<br/>The Learn2Grow Team</p>
    `
  };

  try {
    // Send email
    console.log('Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Run the function and handle results
sendTestEmail()
  .then(result => {
    if (result) {
      console.log('🎉 Test completed successfully. Check your inbox at learn2growad1@gmail.com');
    } else {
      console.log('😞 Test failed. Check the error logs above.');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
