// processNewRecipient.js
// Process emails for a newly registered recipient
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

async function processNewRecipientEmails(email) {
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
    
    // Find the recipient by email
    const recipient = await RecipientRequest.findOne({ email });
    
    if (!recipient) {
      console.error(`❌ No recipient found with email: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`✅ Found recipient: ${recipient.name} (${recipient.email})`);
    console.log(`🔄 Current email status:`, recipient.emailsSent);
    
    // Process emails for this recipient
    console.log('\n📧 Processing confirmation and admin notification emails...');
    const confirmationResults = await emailAutomation.processNewRecipientRequest(recipient);
    console.log('📧 Results:', confirmationResults);
    
    // Process verification email
    console.log('\n📧 Processing verification email...');
    const verificationResult = await emailAutomation.processVerificationEmail(
      recipient,
      "Please provide documentation to verify your eligibility for our program."
    );
    console.log(`📧 Verification email sent: ${verificationResult ? '✅ Sent' : '❌ Failed'}`);
    
    // Check updated recipient
    const updatedRecipient = await RecipientRequest.findOne({ email });
    console.log('\n📊 Updated email status:', updatedRecipient.emailsSent);
    
    // Close database connection
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed');
    console.log('✅ Email processing completed');
  } catch (error) {
    console.error('❌ Error processing recipient emails:', error);
    
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

// Get email from command line argument or use default
const targetEmail = process.argv[2] || 'jusdempenguins@gmail.com';
console.log(`🎯 Target Email: ${targetEmail}`);

// Run the function
processNewRecipientEmails(targetEmail);
