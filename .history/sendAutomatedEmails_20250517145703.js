// sendAutomatedEmails.js
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './db.js';
import emailAutomation from './utils/emailAutomation.js';

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

async function main() {
  try {
    console.log('🚀 Starting automated email sender...');
    await connectDB();
    
    switch (command) {
      case 'pending':
        // Send confirmation emails to pending requests
        console.log('📧 Sending confirmation emails to pending requests...');
        await emailAutomation.sendEmailsByStatus('pending', 'confirmation');
        break;
        
      case 'approved':
        // Send approval emails to approved requests
        console.log('📧 Sending approval emails to approved requests...');
        await emailAutomation.sendEmailsByStatus('approved', 'approval');
        break;
        
      case 'verification':
        // Send verification emails to rejected (verification) requests
        console.log('📧 Sending verification emails to requests needing verification...');
        await emailAutomation.sendEmailsByStatus('rejected', 'verification');
        break;
        
      case 'followup':
        // Send follow-up emails to verification requests that haven't responded
        const daysAgo = parseInt(args[1]) || 7; // Default to 7 days
        console.log(`📧 Sending follow-up emails to verification requests older than ${daysAgo} days...`);
        await emailAutomation.sendVerificationFollowUps(daysAgo);
        break;
        
      case 'all':
        // Send all types of emails based on status
        console.log('📧 Processing all email types...');
        await emailAutomation.sendEmailsByStatus('pending', 'confirmation');
        await emailAutomation.sendEmailsByStatus('approved', 'approval');
        await emailAutomation.sendEmailsByStatus('rejected', 'verification');
        break;
        
      default:
        console.log('🔍 Available commands:');
        console.log('  - pending: Send confirmation emails to pending requests');
        console.log('  - approved: Send approval emails to approved requests');
        console.log('  - verification: Send verification emails to rejected (verification) requests');
        console.log('  - followup [days=7]: Send follow-up emails to verification requests older than [days]');
        console.log('  - all: Process all email types based on status');
        break;
    }
    
    console.log('✅ Email processing complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in automated email sender:', error);
    process.exit(1);
  }
}

main().catch(console.error);
