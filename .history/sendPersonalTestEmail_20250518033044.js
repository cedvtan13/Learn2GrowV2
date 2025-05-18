// sendPersonalTestEmail.js - Send a test email using personal Gmail account
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

async function sendPersonalTestEmail() {
  console.log('🔄 Personal Email Test');
  console.log('---------------------');
  
  console.log('\n⚠️ This script uses your personal Gmail account to send a test email');
  console.log('📝 You will need to have an "App Password" set up for your Gmail account');
  console.log('   (see docs/GMAIL_AUTH_GUIDE.md for instructions)');
  
  // Get email credentials
  const email = await prompt('\n🔑 Your Gmail address: ');
  const appPassword = await prompt('🔐 Your App Password: ');
  const recipientEmail = await prompt('📨 Send test email to: ');
  
  if (!email || !appPassword || !recipientEmail) {
    console.error('❌ All fields are required');
    rl.close();
    return false;
  }
  
  // Create transporter for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: appPassword
    }
  });
  
  console.log(`\n🚀 Sending test email from ${email} to ${recipientEmail}...`);
  
  // Email content
  const mailOptions = {
    from: `"Learn2Grow Test" <${email}>`,
    to: recipientEmail,
    subject: 'Learn2Grow Email System Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Learn2Grow Personal Email Test</h2>
        <p>Hello!</p>
        <p>This is a test email sent from <strong>${email}</strong> using the Learn2Grow testing utility.</p>
        <p>If you're receiving this email, it means:</p>
        <ol>
          <li>Your Gmail App Password is working correctly</li>
          <li>You can successfully send emails via SMTP</li>
          <li>The Learn2Grow email system is configured properly</li>
        </ol>
        <p>Time sent: ${new Date().toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">This is a test message. No action is required.</p>
      </div>
    `
  };
  
  try {
    // Send email
    console.log('📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('\n✅ Email sent successfully!');
    console.log(`📝 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error('Error details:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Possible reasons:');
      console.log('1. App Password is incorrect');
      console.log('2. 2-Step Verification is not enabled on your account');
      console.log('3. Less secure app access is disabled (which is good, use App Passwords instead)');
      console.log('\nFollow the instructions in docs/GMAIL_AUTH_GUIDE.md to set up an App Password');
    }
    
    return false;
  } finally {
    rl.close();
  }
}

// Run the function
sendPersonalTestEmail()
  .then(result => {
    if (result) {
      console.log('\n🎉 Test completed successfully. Check your inbox!');
    } else {
      console.log('\n😞 Test failed. Please check the errors above.');
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    rl.close();
  });
