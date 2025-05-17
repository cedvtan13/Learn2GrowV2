// scheduledEmails.js
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './db.js';
import emailAutomation from './utils/emailAutomation.js';

async function runScheduledEmails() {
  try {
    console.log(`📅 Running scheduled email tasks at ${new Date().toLocaleString()}`);
    await connectDB();
    
    // 1. Send confirmation emails to any new pending requests
    console.log('\n🔹 Processing pending confirmation emails...');
    const pendingResults = await emailAutomation.sendEmailsByStatus('pending', 'confirmation', true);
    
    // 2. Send approval emails to any newly approved requests
    console.log('\n🔹 Processing approval emails...');
    const approvalResults = await emailAutomation.sendEmailsByStatus('approved', 'approval', true);
    
    // 3. Send verification emails to any newly rejected (verification) requests
    console.log('\n🔹 Processing verification emails...');
    const verificationResults = await emailAutomation.sendEmailsByStatus('rejected', 'verification', true);
    
    // 4. Send follow-up emails to verification requests older than 7 days
    console.log('\n🔹 Processing verification follow-ups...');
    const followUpResults = await emailAutomation.sendVerificationFollowUps(7);
    
    // Print summary
    console.log('\n📊 Email Processing Summary:');
    console.log(`Confirmations: ${pendingResults.success} sent, ${pendingResults.failed} failed`);
    console.log(`Approvals: ${approvalResults.success} sent, ${approvalResults.failed} failed`);
    console.log(`Verifications: ${verificationResults.success} sent, ${verificationResults.failed} failed`);
    console.log(`Follow-ups: ${followUpResults.success} sent, ${followUpResults.failed} failed`);
    
    console.log('\n✅ Scheduled email tasks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running scheduled emails:', error);
    process.exit(1);
  }
}

runScheduledEmails().catch(console.error);
