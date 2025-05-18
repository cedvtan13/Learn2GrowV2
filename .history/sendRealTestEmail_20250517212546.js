// sendRealTestEmail.js - Send a real test email to a specific address
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

async function sendRealTestEmail(recipientEmail) {
  console.log(`🚀 Sending a real test email to: ${recipientEmail}`);
  console.log('📧 Using production mode to actually send the email');
  
  // Create transporter with Gmail settings
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || 'learn2growad1@gmail.com',
      pass: process.env.EMAIL_PASS
    }
  });

  console.log(`🔑 Using email account: ${process.env.EMAIL_USER}`);
  
  // Email content
  const mailOptions = {
    from: `"Learn2Grow Platform" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: 'Learn2Grow: Email System Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Learn2Grow Email Test</h2>
        <p>Hello from Learn2Grow!</p>
        <p>This is a <strong>real test email</strong> to verify that our email system is working correctly.</p>
        <p>If you're receiving this, it means the email configuration is successful and we can send emails to users.</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">This is an automated test email from Learn2Grow. Please do not reply to this message.</p>
      </div>
    `
  };

  try {
    // Send email
    console.log('📤 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log(`📝 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Get recipient email from command line argument or use default
const recipientEmail = process.argv[2] || 'kinlato445@gmail.com';

// Run the function
sendRealTestEmail(recipientEmail)
  .then(result => {
    if (result) {
      console.log(`🎉 Test completed successfully. Check your inbox at ${recipientEmail}`);
    } else {
      console.log('😞 Test failed. Check the error logs above.');
    }
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
