// verify-emailjs-templates.js
import dotenv from 'dotenv';
dotenv.config();
import emailjs from '@emailjs/browser';

// Configuration
const USER_ID = process.env.EMAILJS_USER_ID;
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;

// Template IDs to verify
const TEMPLATES = {
  RECIPIENT_VERIFICATION: 'template_verification',
  EXISTING_USER: 'template_existing_user',
  PENDING_REQUEST: 'template_pending',
  ADMIN_NOTIFICATION: 'template_admin_notify',
  RECIPIENT_APPROVAL: 'template_approval',
  RECIPIENT_REJECTION: 'template_rejection',
  PASSWORD_RESET: 'template_password_reset'
};

// Initialize EmailJS
emailjs.init(USER_ID);

/**
 * Verify that a template exists and is accessible
 */
async function verifyTemplate(templateId) {
  try {
    // Send a test email to check if the template is accessible
    const testEmail = process.env.VERIFIED_EMAILS?.split(',')[0] || 'test@example.com';
    const templateParams = {
      to_name: 'Template Verification',
      to_email: testEmail,
      subject: `Template Verification: ${templateId}`,
      website_url: 'http://localhost:3000',
      // Add other common parameters templates might need
      reset_link: 'http://localhost:3000/reset',
      rejection_reason: 'This is a test reason',
      recipient_name: 'Test Recipient',
      recipient_email: 'recipient@example.com',
      admin_email: process.env.ADMIN_EMAIL || 'admin@example.com'
    };
    
    console.log(`🔎 Verifying template: ${templateId}`);
    const response = await emailjs.send(
      SERVICE_ID,
      templateId,
      templateParams
    );
    
    if (response.status === 200) {
      console.log(`✅ Template ${templateId} is valid and accessible`);
      return true;
    } else {
      console.warn(`⚠️ Template ${templateId} returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Template ${templateId} verification failed:`, error.text || error.message);
    return false;
  }
}

/**
 * Verify all templates needed by the application
 */
async function verifyAllTemplates() {
  console.log('🧪 Verifying all EmailJS templates...');
  
  if (!USER_ID || !SERVICE_ID) {
    console.error('❌ Missing configuration. Please set EMAILJS_USER_ID and EMAILJS_SERVICE_ID in your .env file');
    process.exit(1);
  }
  
  console.log(`📨 Using EmailJS USER_ID: ${USER_ID.substring(0, 5)}...`);
  console.log(`📨 Using EmailJS SERVICE_ID: ${SERVICE_ID}`);
  
  console.log('\n🔄 Checking template access...');
  
  let successful = 0;
  let failed = 0;
  
  for (const [templateName, templateId] of Object.entries(TEMPLATES)) {
    const isValid = await verifyTemplate(templateId);
    if (isValid) successful++; else failed++;
  }
  
  console.log('\n📊 Template Verification Summary:');
  console.log(`✅ ${successful} templates verified successfully`);
  console.log(`❌ ${failed} templates failed verification`);
  
  if (failed > 0) {
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check that all templates exist in your EmailJS dashboard');
    console.log('2. Ensure template IDs match exactly with the IDs in your code');
    console.log('3. Verify that your templates include all required parameters');
    console.log('4. Check your EmailJS service is properly configured');
  } else {
    console.log('\n🎉 All templates are verified and ready to use!');
  }
}

// Run the verification
verifyAllTemplates();
