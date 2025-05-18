// testEmailProduction.js
// This version forces production mode for email testing
import emailService from './utils/emailService.js';

// Force production mode
process.env.NODE_ENV = 'production';

async function testEmailsInProduction() {
  console.log('📧 Starting Production Email Test...');
  console.log('Environment Variables (forced):');
  console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
  console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT || '587'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'learn2growad1@gmail.com'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '(set)' : '(not set)'}`);
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'learn2growad1@gmail.com'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  
  const testName = 'Production Test User';
  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER || 'learn2growad1@gmail.com';
  
  try {
    console.log(`\n🔹 Sending test email to ${testEmail}...`);
    const result = await emailService.sendRecipientConfirmation(testName, testEmail);
    
    console.log(`\n✅ Email sending result: ${result}`);
    console.log('📧 If successful, check your inbox at: learn2growad1@gmail.com');
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

testEmailsInProduction().catch(console.error);
