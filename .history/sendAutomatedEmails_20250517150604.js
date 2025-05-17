// sendAutomatedEmails.js
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

// Main function to run the automated email processing
async function sendAutomatedEmails() {
  console.log('🚀 Starting automated email processing job...');
  console.log(`📅 Current time: ${new Date().toLocaleString()}`);
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Process all pending emails
    const results = await emailAutomation.processPendingEmails();
    
    console.log('📊 Email processing summary:');
    console.log(`- Total requests processed: ${results.total}`);
    console.log(`- Confirmation emails sent: ${results.confirmationSent}`);
    console.log(`- Approval emails sent: ${results.approvalSent}`);
    console.log(`- Verification emails sent: ${results.verificationSent}`);
    console.log(`- Errors encountered: ${results.errors}`);
    
    // Close database connection and exit
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error in automated email processing:', error);
    
    // Attempt to close database connection and exit with error code
    try {
      await mongoose.disconnect();
      console.log('👋 Database connection closed after error');
    } catch (disconnectError) {
      console.error('❌ Error closing database connection:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the main function
sendAutomatedEmails().catch((error) => {
  console.error('🔥 Unhandled error:', error);
  process.exit(1);
});