// minimal-test-email.js

import dotenv from 'dotenv';
import { sendEmail } from './utils/emailJSService.js';

dotenv.config();

async function testMinimal() {
  try {
    console.log('Testing minimal email sending...');
    
    const testEmail = process.env.TEST_EMAIL || 'cedv.tan@gmail.com';
    const subject = 'Test Email from Minimal Test';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">Test Email</h2>
        <p>This is a test email from the minimal test script.</p>
      </div>
    `;
    
    console.log(`Sending email to: ${testEmail}`);
    
    const result = await sendEmail(testEmail, subject, html);
    
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testMinimal();
