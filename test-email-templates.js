// test-email-templates.js
import dotenv from 'dotenv';
dotenv.config();
import emailService from './utils/emailJSService.js';

const YOUR_EMAIL = '21101045@usc.edu.ph';
const TEST_NAME = 'Test User';

async function testAllEmailTemplates() {
  try {
    console.log('🧪 Testing all email templates...');
    console.log(`📧 All test emails will be sent to ${YOUR_EMAIL}`);
      console.log('\n1️⃣ Testing new recipient verification email...');
    await emailService.sendNewRecipientVerificationEmail(TEST_NAME, YOUR_EMAIL);
    
    console.log('\n2️⃣ Testing existing user email...');
    await emailService.sendExistingUserEmail(TEST_NAME, YOUR_EMAIL);
    
    console.log('\n3️⃣ Testing pending request email...');
    await emailService.sendPendingRequestEmail(TEST_NAME, YOUR_EMAIL);
    
    console.log('\n4️⃣ Testing admin notification email...');
    await emailService.sendRecipientRequestToAdmin(TEST_NAME, YOUR_EMAIL);
    
    console.log('\n5️⃣ Testing approval email...');
    await emailService.sendRecipientApproval(TEST_NAME, YOUR_EMAIL);
    
    console.log('\n6️⃣ Testing rejection email...');
    await emailService.sendRecipientRejection(TEST_NAME, YOUR_EMAIL, 'This is a test rejection reason.');
    
    console.log('\n✅ All test emails have been sent! Check your inbox: ' + YOUR_EMAIL);
  } catch (error) {
    console.error('❌ Error testing email templates:', error);
  }
}

// Run the test
testAllEmailTemplates();
