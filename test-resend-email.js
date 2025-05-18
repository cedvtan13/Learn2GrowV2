// test-resend-email.js
import dotenv from 'dotenv';
dotenv.config();
import resendEmailService from './utils/resendEmailService.js';

async function testResendEmailService() {
  try {
    console.log('🧪 Testing Resend Email Service...');
    
    // Test parameters
    const name = 'Test User';
    const email = 'cedv.tan@gmail.com'; // Use your own email for testing
    
    // Test the individual email sending functions
    console.log('\n📤 Testing admin notification email...');
    const adminResult = await resendEmailService.sendRecipientRequestToAdmin(name, email);
    console.log('📥 Result:', adminResult);
    
    console.log('\n📤 Testing verification email...');
    const verificationResult = await resendEmailService.sendNewRecipientVerificationEmail(name, email);
    console.log('📥 Result:', verificationResult);
    
    console.log('\n📤 Testing existing user email...');
    const existingUserResult = await resendEmailService.sendExistingUserEmail(name, email);
    console.log('📥 Result:', existingUserResult);
    
    console.log('\n📤 Testing approval email...');
    const approvalResult = await resendEmailService.sendRecipientApproval(name, email);
    console.log('📥 Result:', approvalResult);
    
    console.log('\n📤 Testing rejection email...');
    const rejectionResult = await resendEmailService.sendRecipientRejection(name, email, 'This is just a test rejection.');
    console.log('📥 Result:', rejectionResult);
    
    console.log('\n✅ All email tests completed!');
  } catch (error) {
    console.error('❌ Error testing email service:', error);
  }
}

// Run the test
testResendEmailService();
