// processEmails.js
// A simple script to manually process pending emails in the Learn2Grow system
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import emailAutomation from './utils/emailAutomation.js';

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learn2growV2';
    await mongoose.connect(MONGO_URI);
    console.log(`🔌 Connected to MongoDB: ${mongoose.connection.name}`);
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');
const verifyAllFlag = args.includes('--verify-all');
const recipientEmailArg = args.find(arg => arg.startsWith('--email='));
const recipientEmail = recipientEmailArg ? recipientEmailArg.split('=')[1] : null;

// Main function to process emails
async function processEmails() {
  console.log('🔄 Starting email processing...');
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database, exiting...');
      process.exit(1);
    }
    
    let results;
    
    // Check if we should process a specific recipient email
    if (recipientEmail) {
      console.log(`🔍 Looking for recipient with email: ${recipientEmail}`);
      
      // Import the RecipientRequest model
      const RecipientRequest = (await import('./models/recipientRequestModel.js')).default;
      
      // Find the specific recipient request
      const request = await RecipientRequest.findOne({ email: recipientEmail });
      
      if (!request) {
        console.error(`❌ No recipient found with email: ${recipientEmail}`);
        await mongoose.disconnect();
        process.exit(1);
      }
      
      console.log(`✅ Found recipient: ${request.name} (${request.email})`);
      
      // Process emails for this specific recipient
      const emailResults = await emailAutomation.processNewRecipientRequest(request);
      
      // If verify-all flag is present, send verification email regardless of status
      if (verifyAllFlag || forceFlag) {
        console.log('🔄 Sending verification email...');
        const verificationResult = await emailAutomation.processVerificationEmail(
          request, 
          "Please provide documentation to verify your eligibility for our program."
        );
        console.log(`📨 Verification email: ${verificationResult ? '✅ Sent' : '❌ Failed'}`);
      }
      
      results = {
        processed: 1,
        confirmation: emailResults.confirmation ? 1 : 0,
        adminNotification: emailResults.adminNotification ? 1 : 0
      };
    } else {
      // Process all pending emails (or force reprocessing)
      results = await emailAutomation.processPendingEmails(forceFlag);
      
      // If verify-all flag is present, process all pending verification emails
      if (verifyAllFlag) {
        console.log('🔄 Processing verification emails for all pending recipients...');
        const verifyResults = await emailAutomation.processAllVerificationEmails(forceFlag);
        console.log(`📨 Sent ${verifyResults.sent} verification emails (${verifyResults.failed} failed)`);
        
        results.verificationSent = verifyResults.sent;
      }
    }
    
    // Print results
    console.log('\n📊 Email processing results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    console.log('✅ Email processing completed');
  } catch (error) {
    console.error('❌ Error in email processing:', error);
    
    // Attempt to close database connection
    try {
      await mongoose.disconnect();
      console.log('👋 Database connection closed after error');
    } catch (disconnectError) {
      console.error('❌ Error closing database connection:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the email processing
processEmails();

console.log(`
📧 Learn2Grow Email Processing Tool
----------------------------------
Command line options:
  --force         Force sending emails even if they've been sent before
  --verify-all    Send verification emails to all pending recipients
  --email=x@y.com Process emails for a specific recipient only

Examples:
  node processEmails.js                        # Process all pending emails
  node processEmails.js --force                # Resend all emails
  node processEmails.js --verify-all           # Send verification emails to all
  node processEmails.js --email=user@test.com  # Process for specific email
`);
