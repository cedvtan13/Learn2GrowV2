// checkRecipients.js
// Check recipient requests in the database
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

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

async function checkRecipientRequests() {
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database, exiting...');
      process.exit(1);
    }
    
    // Import the RecipientRequest model
    const RecipientRequest = (await import('./models/recipientRequestModel.js')).default;
    
    // Find all recipient requests
    const requests = await RecipientRequest.find();
    
    console.log(`\n🔍 Found ${requests.length} recipient requests:`);
    
    if (requests.length === 0) {
      console.log('❌ No recipient requests found in the database.');
    } else {
      requests.forEach((req, index) => {
        console.log(`\n--- Request ${index + 1} ---`);
        console.log(`🆔 ID: ${req._id}`);
        console.log(`👤 Name: ${req.name}`);
        console.log(`📧 Email: ${req.email}`);
        console.log(`🔄 Status: ${req.status}`);
        console.log(`📅 Created At: ${req.createdAt}`);
        console.log(`📨 Emails Sent:`, req.emailsSent ? JSON.stringify(req.emailsSent) : 'None');
        console.log(`⏱️ Last Email Sent: ${req.lastEmailSent || 'None'}`);
        console.log(`📝 Last Email Type: ${req.lastEmailType || 'None'}`);
      });
    }
    
    // Close connection
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error checking recipient requests:', error);
    
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
checkRecipientRequests();
