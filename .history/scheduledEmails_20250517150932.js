// scheduledEmails.js
// This script sets up scheduled tasks to automatically process emails periodically
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

// Main function that runs on schedule
async function processScheduledEmails() {
  const startTime = new Date();
  console.log(`\n🕒 Scheduled email processing started at ${startTime.toLocaleString()}`);
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database.');
      return;
    }
    
    // Process all pending emails
    const results = await emailAutomation.processPendingEmails();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log(`\n📊 Email processing summary (completed in ${duration}s):`);
    console.log(`- Total requests processed: ${results.total}`);
    console.log(`- Confirmation emails sent: ${results.confirmationSent}`);
    console.log(`- Approval emails sent: ${results.approvalSent}`);
    console.log(`- Verification emails sent: ${results.verificationSent}`);
    console.log(`- Errors encountered: ${results.errors}`);
    
    // Close database connection
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error in scheduled email processing:', error);
    
    // Attempt to close database connection
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('❌ Error closing database connection:', disconnectError);
    }
  }
}

// Set up the schedule to run every hour
console.log('🚀 Starting scheduled email processing service');
console.log('📅 Scheduled to run every hour');

// Run once immediately on startup
processScheduledEmails();

// Then set up the interval to run every hour (3600000 ms)
const INTERVAL_MS = 3600000; // 1 hour
setInterval(processScheduledEmails, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down scheduled email service...');
  try {
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  process.exit();
});

console.log(`🔄 Next scheduled run at ${new Date(Date.now() + INTERVAL_MS).toLocaleTimeString()}`);