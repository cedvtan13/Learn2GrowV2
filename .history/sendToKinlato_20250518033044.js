// sendToKinlato.js - Script specifically to send a test email to kinlato445@gmail.com
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Constants
const RECIPIENT_EMAIL = 'kinlato445@gmail.com';

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function sendEmailToKinlato() {
  console.log(`📧 Learn2Grow Email Test - Target: ${RECIPIENT_EMAIL}`);
  console.log('-----------------------------------------------');
  
  console.log('\n💡 This script will send a test email to:', RECIPIENT_EMAIL);
  console.log('👉 You will need to provide valid Gmail credentials with an App Password');
  
  // Get sender credentials
  const senderEmail = await prompt('\n📤 Gmail address to send from: ');
  const appPassword = await prompt('🔑 App Password for this Gmail account: ');
  
  if (!senderEmail || !appPassword) {
    console.error('❌ Both sender email and App Password are required');
    rl.close();
    return false;
  }
  
  // Create transporter for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: appPassword
    }
  });
  
  console.log(`\n🚀 Preparing to send test email from ${senderEmail} to ${RECIPIENT_EMAIL}...`);
  
  // Email content with rich formatting
  const mailOptions = {
    from: `"Learn2Grow Test" <${senderEmail}>`,
    to: RECIPIENT_EMAIL,
    subject: 'Learn2Grow Email System Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <div style="background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%); padding: 20px; border-radius: 5px 5px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0;">Learn2Grow</h1>
          <p style="margin: 5px 0 0;">Email System Verification</p>
        </div>
        
        <div style="padding: 20px;">
          <h2>Hello Kin!</h2>
          <p>This email confirms that the Learn2Grow email system is working correctly.</p>
          <p><strong>What this means:</strong> The platform can now send automated emails for:</p>
          <ul>
            <li>New recipient registrations</li>
            <li>Verification requests</li>
            <li>Approval notifications</li>
            <li>System alerts</li>
          </ul>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Technical Details:</strong></p>
            <p style="margin: 10px 0 0;">• Sent from: ${senderEmail}</p>
            <p style="margin: 5px 0 0;">• Sent to: ${RECIPIENT_EMAIL}</p>
            <p style="margin: 5px 0 0;">• Date: ${new Date().toLocaleString()}</p>
          </div>
          
          <p>If you need to make changes to the email system configuration, check the documentation in:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">docs/EMAIL_TESTING_GUIDE.md</p>
        </div>
        
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; text-align: center;">
          <p>This is an automated test message. No action required.</p>
          <p style="margin: 5px 0 0;">Learn2Grow Platform &copy; 2025</p>
        </div>
      </div>
    `
  };
  
  try {
    // Send email
    console.log('\n📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('\n✅ Email sent successfully!');
    console.log(`📝 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Possible reasons:');
      console.log('1. App Password is incorrect');
      console.log('2. 2-Step Verification is not enabled on your account');
      console.log('3. The email or password contains typos');
      console.log('\nReference the docs/GMAIL_AUTH_GUIDE.md for help setting up an App Password');
    }
    
    return false;
  } finally {
    rl.close();
  }
}

// Run the function
sendEmailToKinlato()
  .then(result => {
    if (result) {
      console.log('\n🎉 Success! Please check the inbox for:', RECIPIENT_EMAIL);
      console.log('(Don\'t forget to check the Spam/Junk folder if you don\'t see it)');
    } else {
      console.log('\n😞 Failed to send the email. Review the errors above and try again.');
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    rl.close();
  });
