// testDirectSend.js
// Test direct email sending without using the database
import dotenv from 'dotenv';
dotenv.config();
import emailService from './utils/emailService.js';

// Parse command-line arguments
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='));
const nameArg = args.find(arg => arg.startsWith('--name='));

// Set values (defaults or from command line)
const email = emailArg ? emailArg.split('=')[1] : 'kinlato445@gmail.com';
const name = nameArg ? nameArg.split('=')[1] : 'Test User';

console.log(`🚀 Testing direct email sending to: ${email}`);

// First, send a confirmation email
console.log(`📧 Sending confirmation email to ${name} (${email})...`);
emailService.sendRecipientConfirmation(name, email)
  .then(result => {
    console.log(`✉️ Confirmation email: ${result ? '✅ Sent' : '❌ Failed'}`);
    
    // Next, send a verification email
    console.log(`\n📧 Sending verification email to ${name} (${email})...`);
    return emailService.sendRecipientVerification(
      name, 
      email,
      "This is a test verification request. Please provide necessary documentation."
    );
  })
  .then(result => {
    console.log(`✉️ Verification email: ${result ? '✅ Sent' : '❌ Failed'}`);
    
    // Finally, send an admin notification
    console.log(`\n📧 Sending admin notification about ${name} (${email})...`);
    return emailService.sendRecipientRequestToAdmin(name, email);
  })
  .then(result => {
    console.log(`✉️ Admin notification: ${result ? '✅ Sent' : '❌ Failed'}`);
    
    // Summary
    console.log(`\n✅ Test completed. Please check ${email} and the admin email for messages.`);
  })
  .catch(error => {
    console.error('❌ Error during email tests:', error);
    process.exit(1);
  });
