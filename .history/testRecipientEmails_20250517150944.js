// testRecipientEmails.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import emailAutomation from './utils/emailAutomation.js';

// Command line args parsing
const args = process.argv.slice(2);
const targetEmail = args.find(arg => arg.includes('@'));
const action = args.find(arg => ['process-all', 'test-specific', 'list'].includes(arg)) || 'process-all';

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learn2grow';
    await mongoose.connect(MONGO_URI);
    console.log(`🔌 Connected to MongoDB: ${mongoose.connection.name}`);
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    return false;
  }
}

// Main function
async function main() {
  console.log('📧 Starting Recipient Email Test...');
  console.log('Environment Variables:');
  console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || '(not set)'}`);
  console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT || '(not set)'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || '(not set)'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '(set)' : '(not set)'}`);
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '(not set)'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`);
  console.log(`Action: ${action}`);
  if (targetEmail) console.log(`Target Email: ${targetEmail}`);
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Import the RecipientRequest model
    const RecipientRequest = (await import('./models/recipientRequestModel.js')).default;
    
    // Handle different actions
    switch (action) {
      case 'list':
        // List all recipient requests
        const requests = await RecipientRequest.find().select('-password').lean();
        console.log('\n📋 Recipient Requests in Database:');
        
        if (requests.length === 0) {
          console.log('No recipient requests found in database.');
        } else {
          requests.forEach((request, index) => {
            console.log(`\n${index+1}. ${request.name} (${request.email})`);
            console.log(`   Status: ${request.status}`);
            console.log(`   Created: ${request.createdAt}`);
            console.log(`   Emails:`);
            for (const [type, sent] of Object.entries(request.emailsSent || {})) {
              console.log(`     - ${type}: ${sent ? '✅ Sent' : '❌ Not sent'}`);
            }
          });
          console.log(`\nTotal Requests: ${requests.length}`);
        }
        break;
        
      case 'test-specific':
        // Test sending specific email type to a specific recipient
        if (!targetEmail) {
          console.error('❌ Error: No target email specified. Use: node testRecipientEmails.js test-specific example@email.com');
          process.exit(1);
        }
        
        const recipient = await RecipientRequest.findOne({ email: targetEmail });
        if (!recipient) {
          console.error(`❌ Error: No recipient found with email ${targetEmail}`);
          process.exit(1);
        }
        
        console.log(`\n🔹 Testing emails for ${recipient.name} (${recipient.email})...`);
        
        // Test all email types
        const confirmationResult = await emailAutomation.processNewRecipientRequest(recipient);
        console.log(`✅ Confirmation email processing result:`, confirmationResult);
        
        const approvalResult = await emailAutomation.processApprovalEmail(recipient);
        console.log(`✅ Approval email result: ${approvalResult}`);
        
        const verificationResult = await emailAutomation.processVerificationEmail(
          recipient, 
          'Please provide proof of your current educational enrollment status to verify your eligibility.'
        );
        console.log(`✅ Verification email result: ${verificationResult}`);
        
        console.log('\n📧 All test emails completed!');
        break;
        
      case 'process-all':
      default:
        // Process all pending emails
        console.log('\n🔄 Processing all pending recipient emails...');
        const results = await emailAutomation.processPendingEmails();
        console.log('📊 Results:', results);
        break;
    }
    
    // Close database connection
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the main function
main().catch(console.error).finally(() => process.exit());
