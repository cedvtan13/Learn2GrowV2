// test-emailjs.js
import dotenv from 'dotenv';
dotenv.config();
import { SMTPClient } from '@emailjs/nodejs';

// Configuration
const USER_ID = process.env.EMAILJS_USER_ID;
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = 'template_verification'; // Replace with your template ID

// Initialize EmailJS
const client = new SMTPClient({
  user: USER_ID,
  password: process.env.EMAILJS_PASSWORD || 'your_password',
  host: 'smtp.emailjs.com',
  ssl: true,
});

/**
 * Test function to verify EmailJS configuration
 */
async function testEmailJS() {  try {
    console.log('🧪 Testing EmailJS basic configuration...');
    console.log(`USER_ID: ${USER_ID ? 'Found' : 'Missing'}`);
    console.log(`SERVICE_ID: ${SERVICE_ID ? 'Found' : 'Missing'}`);
    
    if (!USER_ID || !SERVICE_ID) {
      console.error('❌ Missing configuration values. Please check your .env file.');
      console.error('   Make sure you have EMAILJS_USER_ID and EMAILJS_SERVICE_ID set.');
      process.exit(1);
    }
    
    // Test email parameters
    const testEmail = process.env.VERIFIED_EMAILS?.split(',')[0] || 'test@example.com';
    
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    // Send the test email using EmailJS node client
    const response = await client.send({
      from: 'learn2grow@example.com',
      to: testEmail,
      subject: 'EmailJS Test Email',
      text: 'This is a test email from EmailJS in NodeJS environment',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">EmailJS Test</h2>
          <p>Hello Test User,</p>
          <p>This is a test email from the Learn2Grow application.</p>
          <p>If you received this email, your EmailJS configuration is working correctly!</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `
    });
    
    console.log('✅ EmailJS test successful!');
    console.log('📊 Response:', response);
    console.log('\n🎉 Your EmailJS configuration is working properly!');
    console.log('   You can now use the email service in your application.');
    
  } catch (error) {
    console.error('❌ EmailJS test failed with error:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log(' - Check your USER_ID and SERVICE_ID values');
    console.log(' - Verify that your template ID exists and is correct');
    console.log(' - Make sure your email service is properly configured in EmailJS dashboard');
    console.log(' - Check if you have exceeded your EmailJS plan limits');
  }
}

// Run the test
testEmailJS();
