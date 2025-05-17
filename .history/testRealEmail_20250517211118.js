// testRealEmail.js - Send a real email using Gmail SMTP
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function sendTestEmail(recipient = null, testMode = false) {
  console.log('🔄 Starting real email test with Gmail SMTP...');
  
  // Get recipient from command line args or use default
  if (!recipient) {
    recipient = process.env.EMAIL_USER || 'learn2growad1@gmail.com';
  }
  
  console.log(`📧 Test email will be sent to: ${recipient}`);
  
  // Create transporter with Gmail settings
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'learn2growad1@gmail.com',
      pass: process.env.EMAIL_PASS
    }
  });

  console.log(`🔑 Using account: ${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}`);
  console.log(`🔐 Password from .env: ${process.env.EMAIL_PASS ? '(set)' : '(not set)'}`);
  
  if (testMode) {
    console.log('⚠️ TEST MODE: Not actually sending the email');
    return true;
  }

  // Email content
  const mailOptions = {
    from: `"Learn2Grow" <${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}>`,
    to: recipient,
    subject: 'Test Email from Learn2Grow',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email from Learn2Grow's automated email system.</p>
      <p>If you've received this email, the email system is working correctly!</p>
      <p>Time sent: ${new Date().toLocaleString()}</p>
      <p>Best regards,<br/>The Learn2Grow Team</p>
    `
  };
  try {
    // Send email
    console.log('📤 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log(`📝 Message ID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error(error.message);
    if (error.code === 'EAUTH') {
      console.error('💡 Authentication error: Check if you need to create an App Password in your Google account');
      console.error('   Follow the instructions in docs/EMAIL_SETUP_GUIDE.md');
    }
    return false;
  }
}

// Process command line arguments
const args = process.argv.slice(2);
const testMode = args.includes('--test');
const recipient = args.find(arg => arg.startsWith('--to='))?.split('=')[1];

// Run the function and handle results
sendTestEmail(recipient, testMode)
  .then(result => {
    if (result) {
      if (testMode) {
        console.log('🎉 Test simulation completed successfully (no email actually sent).');
      } else {
        console.log(`🎉 Test completed successfully. Check the inbox at ${recipient || 'learn2growad1@gmail.com'}`);
      }
    } else {
      console.log('😞 Test failed. Check the error logs above.');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
