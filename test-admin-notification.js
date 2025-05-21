// test-admin-notification.js
import dotenv from 'dotenv';
import { sendRecipientRequestToAdmin } from './utils/emailJSService.js';

dotenv.config();

async function testAdminNotification() {
  console.log('Testing admin notification email...');
  
  try {
    const testName = 'Test Recipient';
    const testEmail = 'testrecipient@example.com';
    
    console.log(`Sending admin notification for ${testName} (${testEmail})...`);
    
    const result = await sendRecipientRequestToAdmin(testName, testEmail);
    
    console.log('Admin notification sent successfully!');
    console.log('Result:', result);
    
    console.log('\nPlease check your email logs for the admin notification email.');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

testAdminNotification();
