// test-resend.js
import dotenv from 'dotenv';
dotenv.config();
import { Resend } from 'resend';

async function testResendDirectly() {
  try {
    console.log('🔍 Testing Resend API directly with their example pattern...');
    console.log('Environment variables:');
    console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set (starts with: ' + process.env.RESEND_API_KEY?.substring(0, 5) + '...)' : '❌ Not set');
    console.log('- FROM_EMAIL:', process.env.FROM_EMAIL ? '✅ ' + process.env.FROM_EMAIL : '❌ Not set');
    
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const fromEmail = process.env.FROM_EMAIL || '21101045@usc.edu.ph';
    const testEmail = 'cedv.tan@gmail.com'; // Change this to your test email
    
    console.log(`📧 Sending test email from ${fromEmail} to ${testEmail}`);
    
    const data = await resend.emails.send({
      from: `Learn2Grow <${fromEmail}>`,
      to: [testEmail],
      subject: 'Test Email from Learn2Grow',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #4CAF50;">Test Email from Learn2Grow</h1>
          <p>This is a test email to confirm that the Resend API is working correctly.</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
          <p>If you're seeing this, email sending is working!</p>
        </div>
      `,
    });
    
    console.log('✅ Success! Email sent with ID:', data.id);
    console.log('Full response:', data);  } catch (error) {
    console.error('❌ Error sending email with Resend:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.data);
    } else {
      console.error('Full error:', error);
    }
    
    // Check for common issues
    if (!process.env.RESEND_API_KEY) {
      console.error('🔴 RESEND_API_KEY is not set in .env file');
    }
    
    if (error.message?.includes('unauthorized')) {
      console.error('🔴 API key appears to be invalid or unauthorized');
    }
  }
}

testResendDirectly();
