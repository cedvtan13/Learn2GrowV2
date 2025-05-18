// test-resend-direct.js
import { Resend } from 'resend';

// Hardcode API key and emails for testing
const API_KEY = 're_dtJxGRrC_A9tonZhoKHfGaqaSXWSGvCqQ';
const FROM_EMAIL = 'onboarding@resend.dev';
const TO_EMAIL = '21101045@usc.edu.ph'; // Using verified email while waiting for domain verification

async function sendTestEmail() {
  try {
    console.log('🚀 Starting direct Resend API test...');
    console.log(`Using API key: ${API_KEY.substring(0, 5)}...`);
    
    const resend = new Resend(API_KEY);
    
    console.log(`Sending email from: Learn2Grow <${FROM_EMAIL}>`);
    console.log(`Sending email to: ${TO_EMAIL}`);

    const { data, error } = await resend.emails.send({
      from: `Learn2Grow <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject: 'Test Email from Learn2Grow Direct',
      html: '<strong>This is a direct test of the Resend API</strong>',
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Response data:', data);
  } catch (error) {
    console.error('❌ Exception occurred:', error);
  }
}

sendTestEmail();
