# Simple Email Test

This is a very simple email test script to check if your email configuration is working properly in production mode.

```javascript
// email-test.js
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

async function sendTestEmail() {
  console.log('Starting email test...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  console.log('Transporter created, verifying connection...');
  
  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('Sending test email...');
    
    // Send email
    const info = await transporter.sendMail({
      from: `"Learn2Grow" <${process.env.EMAIL_USER}>`,
      to: '21101045@usc.edu.ph',
      subject: 'Test Email from Learn2Grow',
      text: 'This is a test email from Learn2Grow to verify email sending.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4CAF50;">Test Email from Learn2Grow</h2>
          <p>This is a test email to verify that your email service is working correctly in production mode.</p>
          <p>If you're receiving this, your email configuration is correct! 🎉</p>
          <p>Time sent: ${new Date().toString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your username and password.');
    }
  }
}

sendTestEmail();
```

To run this test:

```bash
node email-test.js
```
