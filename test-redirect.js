// test-redirect.js - Tests email redirection in development mode
import dotenv from 'dotenv';
dotenv.config();
import { sendEmail } from './utils/emailJSService.js';

// Email to test (this will be redirected if not verified)
const TO_EMAIL = 'ccvt13west@gmail.com';

async function testRedirection() {
  try {
    console.log('🚀 Testing email redirection...');
    console.log(`Attempting to send email to: ${TO_EMAIL}`);
    console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Verified emails: ${process.env.VERIFIED_EMAILS}`);
    
    const response = await sendEmail(
      TO_EMAIL,
      'Test Email with Redirection',
      `<p>This is a test email sent to ${TO_EMAIL}.</p>
       <p>In development mode, it should be redirected to the first verified email.</p>`
    );
    
    console.log('Response:', response);
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    process.exit(0);
  }
}

testRedirection();
