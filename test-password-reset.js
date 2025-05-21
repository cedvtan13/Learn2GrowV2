// test-password-reset.js
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

// Settings
const API_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.VERIFIED_EMAILS?.split(',')[0] || '21101045@usc.edu.ph';

/**
 * Test the password reset flow
 */
async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Flow...');
  console.log(`🔧 Using API URL: ${API_URL}`);
  console.log(`📧 Using test email: ${TEST_EMAIL}`);
  
  try {
    // Step 1: Request password reset email
    console.log('\n📤 Step 1: Requesting password reset email...');
    
    const resetResponse = await fetch(`${API_URL}/api/users/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    const resetData = await resetResponse.json();
    
    if (!resetResponse.ok) {
      throw new Error(`Failed to request password reset: ${resetData.message}`);
    }
    
    console.log('✅ Password reset requested successfully');
    
    // In development mode, the API returns the reset token directly
    // We can use this to test the full flow
    const resetToken = resetData.resetToken;
    
    if (resetToken) {
      console.log('🔑 Reset token retrieved from development mode API response');
      console.log('\n📤 Step 2: Simulating reset password with token...');
      
      // Test resetting the password with the token
      const newPassword = 'NewPassword123!';
      
      const resetPasswordResponse = await fetch(`${API_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: resetToken,
          password: newPassword
        })
      });
      
      const resetPasswordData = await resetPasswordResponse.json();
      
      if (!resetPasswordResponse.ok) {
        throw new Error(`Failed to reset password: ${resetPasswordData.message}`);
      }
      
      console.log('✅ Password reset successful');
      console.log('\n📤 Step 3: Testing login with new password...');
      
      // Test logging in with the new password
      const loginResponse = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: newPassword
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        throw new Error(`Login failed with new password: ${loginData.message}`);
      }
      
      console.log('✅ Successfully logged in with new password');
      console.log(`👤 User: ${loginData.name} (${loginData.email})`);
    } else {
      console.log('ℹ️ No reset token available in response (normal in production mode)');
      console.log('ℹ️ Check the email sent to your inbox or the email-logs directory');
      
      // In production mode, the email is sent to the user
      // In development mode with logging enabled, the email is saved to a file
      console.log('\n📧 What to do next:');
      console.log('1. Check your email inbox for the password reset link');
      console.log('2. Or check the email-logs directory for saved email content');
      console.log('3. Open the reset link in a browser to complete the process');
    }
    
    console.log('\n✅ Password reset flow test completed!');
  } catch (error) {
    console.error('\n❌ Error during password reset test:', error.message);
  }
}

// Run the test
testPasswordReset();
