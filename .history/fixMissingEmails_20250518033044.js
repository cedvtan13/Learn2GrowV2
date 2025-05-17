// fixMissingEmails.js
// Fix recipients in the database that have missing emails
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

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

async function fixMissingEmails() {
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database, exiting...');
      process.exit(1);
    }
    
    // Import the RecipientRequest model and emailAutomation
    const RecipientRequest = (await import('./models/recipientRequestModel.js')).default;
    const emailAutomationModule = await import('./utils/emailAutomation.js');
    const emailAutomation = emailAutomationModule.default;
    
    // Find all recipient requests that are missing emails
    const recipients = await RecipientRequest.find({
      $or: [
        { 'emailsSent.confirmation': { $ne: true } },
        { 'emailsSent.verification': { $ne: true } }
      ]
    });
    
    console.log(`\n🔍 Found ${recipients.length} recipients with missing emails:`);
    
    if (recipients.length === 0) {
      console.log('✅ No recipients with missing emails found. All good!');
    } else {
      // Process each recipient
      for (const recipient of recipients) {
        console.log(`\n--- Processing ${recipient.name} (${recipient.email}) ---`);
        console.log(`🔄 Current email status:`, JSON.stringify(recipient.emailsSent));
        
        // Process confirmation and admin notification emails if needed
        if (!recipient.emailsSent?.confirmation) {
          console.log('\n📧 Processing confirmation and admin notification emails...');
          const confirmationResults = await emailAutomation.processNewRecipientRequest(recipient);
          console.log('📧 Results:', confirmationResults);
        } else {
          console.log('✅ Confirmation email already sent, skipping.');
        }
        
        // Process verification email if needed
        if (!recipient.emailsSent?.verification) {
          console.log('\n📧 Processing verification email...');
          const verificationResult = await emailAutomation.processVerificationEmail(
            recipient,
            "Please provide documentation to verify your eligibility for our program."
          );
          console.log(`📧 Verification email sent: ${verificationResult ? '✅ Sent' : '❌ Failed'}`);
        } else {
          console.log('✅ Verification email already sent, skipping.');
        }
        
        // Get the updated recipient data
        const updatedRecipient = await RecipientRequest.findById(recipient._id);
        console.log(`\n📊 Updated email status: ${JSON.stringify(updatedRecipient.emailsSent)}`);
      }
    }
    
    // Close database connection
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed');
    console.log('✅ Email fixing process completed');
  } catch (error) {
    console.error('❌ Error fixing missing emails:', error);
    
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

// Run the function
fixMissingEmails();
