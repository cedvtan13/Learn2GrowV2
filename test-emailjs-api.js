// test-emailjs-api.js
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

// Configuration
const USER_ID = process.env.EMAILJS_USER_ID;
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = 'template_verification'; // Replace with your template ID

/**
 * Send an email using EmailJS REST API
 */
async function sendEmailWithAPI() {
  try {
    console.log('🧪 Testing EmailJS API configuration...');
    console.log(`USER_ID: ${USER_ID ? 'Found' : 'Missing'}`);
    console.log(`SERVICE_ID: ${SERVICE_ID ? 'Found' : 'Missing'}`);
    
    if (!USER_ID || !SERVICE_ID) {
      console.error('❌ Missing configuration values. Please check your .env file.');
      console.error('   Make sure you have EMAILJS_USER_ID and EMAILJS_SERVICE_ID set.');
      process.exit(1);
    }
    
    // Test email parameters
    const testEmail = process.env.VERIFIED_EMAILS?.split(',')[0] || 'test@example.com';
    const templateParams = {
      to_name: 'Test User',
      to_email: testEmail,
      subject: 'EmailJS API Test Email',
      website_url: 'http://localhost:3000'
    };
    
    console.log(`📧 Sending test email to: ${testEmail}`);
    console.log('📝 Template params:', templateParams);
    
    // Send the test email using EmailJS REST API
    const url = 'https://api.emailjs.com/api/v1.0/email/send';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: USER_ID,
        template_params: templateParams
      })
    });
    
    if (response.ok) {
      console.log('✅ EmailJS API test successful!');
      console.log('📊 Response status:', response.status);
      console.log('\n🎉 Your EmailJS configuration is working properly!');
      console.log('   You can now use the email service in your application.');
    } else {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ EmailJS API test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log(' - Check your USER_ID and SERVICE_ID values');
    console.log(' - Verify that your template ID exists and is correct');
    console.log(' - Make sure your email service is properly configured in EmailJS dashboard');
    console.log(' - Check if you have exceeded your EmailJS plan limits');
  }
}

// Run the test
sendEmailWithAPI();
