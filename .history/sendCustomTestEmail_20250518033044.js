// sendCustomTestEmail.js - Send a test email using custom credentials
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function sendTestEmail() {
  console.log('🔄 Email Testing Utility');
  console.log('------------------------');
  
  // Get email credentials
  console.log('\n📧 Enter the sender email credentials:');
  const senderEmail = await prompt('Sender Email (default: learn2growad1@gmail.com): ') || 'learn2growad1@gmail.com';
  const password = await prompt('Email Password or App Password: ');
  const recipientEmail = await prompt('Recipient Email (where to send the test): ');
  
  if (!password) {
    console.error('❌ Password is required');
    return false;
  }
  
  if (!recipientEmail) {
    console.error('❌ Recipient email is required');
    return false;
  }
  
  console.log(`\n🚀 Setting up test with:`);
  console.log(`- Sender: ${senderEmail}`);
  console.log(`- Recipient: ${recipientEmail}`);
  
  // Create transporter with given credentials
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: senderEmail,
      pass: password
    }
  });
  
  // Email content
  const mailOptions = {
    from: `"Learn2Grow Test" <${senderEmail}>`,
    to: recipientEmail,
    subject: 'Learn2Grow: Custom Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Custom Email Test</h2>
        <p>Hello from Learn2Grow!</p>
        <p>This is a <strong>custom test email</strong> sent using the provided credentials.</p>
        <p>If you're receiving this, it means the email configuration is working correctly.</p>
        <p><b>From:</b> ${senderEmail}</p>
        <p><b>To:</b> ${recipientEmail}</p>
        <p><b>Time sent:</b> ${new Date().toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">This is an automated test email. Please do not reply to this message.</p>
      </div>
    `
  };
  
  try {
    // Send email
    console.log('\n📤 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log(`📝 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', error.message);
    return false;
  } finally {
    rl.close();
  }
}

// Run the function
sendTestEmail()
  .then(result => {
    if (result) {
      console.log('🎉 Test completed successfully. Check your inbox!');
    } else {
      console.log('😞 Test failed. Please check the error logs above.');
    }
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    rl.close();
    process.exit(1);
  });
