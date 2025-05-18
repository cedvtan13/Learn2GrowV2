// verify-email.js
import dotenv from 'dotenv';
dotenv.config();
import { Resend } from 'resend';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get API key
const API_KEY = process.env.RESEND_API_KEY || '';
if (!API_KEY) {
  console.error('🔴 Error: RESEND_API_KEY is not set in .env file');
  process.exit(1);
}

// Initialize Resend
const resend = new Resend(API_KEY);

/**
 * Send a verification email using Resend
 * @param {string} email - Email to verify
 */
async function sendVerificationEmail(email) {
  try {
    console.log(`🔄 Sending verification email to: ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: 'Learn2Grow <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify Your Email Address for Learn2Grow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">Email Verification</h2>
          <p>Hello,</p>
          <p>This email was sent to verify that <strong>${email}</strong> is a valid email address for your Learn2Grow application.</p>
          <p>If you received this email, it means the verification was successful.</p>
          <p>You can now add this email to your VERIFIED_EMAILS list in your .env file.</p>
          <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
          <p>Best regards,<br>The Learn2Grow Team</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error sending verification email:', error);
      return;
    }

    console.log('✅ Verification email sent successfully!');
    console.log('📝 Instructions:');
    console.log('1. Check your email inbox for the verification email');
    console.log('2. Once received, update your .env file:');
    console.log(`   VERIFIED_EMAILS=21101045@usc.edu.ph,${email}`);
    console.log('3. Restart your application for changes to take effect');
    
  } catch (error) {
    console.error('❌ Exception occurred:', error);
  }
}

// Ask for the email to verify
console.log('📧 Email Verification Tool');
console.log('This tool helps verify additional email addresses for testing with Resend');
rl.question('Enter the email address you want to verify: ', (email) => {
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    rl.close();
    return;
  }
  
  sendVerificationEmail(email).then(() => rl.close());
});
