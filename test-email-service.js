// test-email-service.js
import dotenv from 'dotenv';
dotenv.config();
import { sendEmail } from './utils/emailJSService.js';

// Test parameters
const TEMPLATES = {
  RECIPIENT_VERIFICATION: 'template_verification',
  EXISTING_USER: 'template_existing_user',
  PENDING_REQUEST: 'template_pending',
  ADMIN_NOTIFICATION: 'template_admin_notify',
  RECIPIENT_APPROVAL: 'template_approval',
  RECIPIENT_REJECTION: 'template_rejection',
  PASSWORD_RESET: 'template_password_reset'
};

async function testEmailService() {
  try {
    console.log('🧪 Testing Email Service...');
    
    // Get test email from environment or use default
    const testEmail = process.env.VERIFIED_EMAILS?.split(',')[0] || 'test@example.com';
    console.log(`📧 Using test email: ${testEmail}`);
    
    // Test the password reset email
    console.log('\n📤 Testing password reset email...');
    const resetParams = {
      to_name: 'Test User',
      to_email: testEmail,
      reset_link: 'http://localhost:3000/reset-password.html?token=test-token-123456'
    };
    
    const resetResult = await sendEmail(TEMPLATES.PASSWORD_RESET, resetParams);
    console.log('📥 Result:', resetResult.data ? 'Success' : 'Failed', resetResult.error || '');
    
    console.log('\n✅ Email test completed!');
  } catch (error) {
    console.error('❌ Error testing email service:', error);
  }
}

// Run the test
testEmailService();
