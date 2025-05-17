// testEmail.js
import dotenv from 'dotenv';
dotenv.config();
import emailService from './utils/emailService.js';

async function testEmails() {
  console.log('📧 Starting Email Test...');
  console.log('Environment Variables:');
  console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || '(not set)'}`);
  console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT || '(not set)'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || '(not set)'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '(set)' : '(not set)'}`);
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '(not set)'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`);
    const testName = 'Test User';
  const testEmail = 'kinlato445@gmail.com'; // Hardcoded recipient email for testing
  
  console.log(`📧 Will send test emails to: ${testEmail}`);
  
  try {
    console.log(`\n🔹 Testing recipient request emails to ${testEmail}...`);
    const requestResult = await Promise.all([
      emailService.sendRecipientRequestToAdmin(testName, testEmail),
      emailService.sendRecipientConfirmation(testName, testEmail)
    ]);
    console.log(`✅ Request emails sent: ${requestResult}`);
    
    console.log(`\n🔹 Testing approval email to ${testEmail}...`);
    const approvalResult = await emailService.sendRecipientApproval(testName, testEmail);
    console.log(`✅ Approval email sent: ${approvalResult}`);
      console.log(`\n🔹 Testing verification email to ${testEmail}...`);
    const verificationResult = await emailService.sendRecipientVerification(testName, testEmail, 'Please provide proof of your current educational enrollment status.');
    console.log(`✅ Verification email sent: ${verificationResult}`);
    
    console.log('\n📧 All email tests completed!');
  } catch (error) {
    console.error('❌ Error sending test emails:', error);
  }
}

testEmails().catch(console.error);
