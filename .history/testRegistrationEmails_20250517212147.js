// testRegistrationEmails.js
// This script tests the automated email flow that happens when a new recipient registers
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

// Main function to test recipient registration email flow
async function testRegistrationEmailFlow() {
  console.log('🚀 Testing recipient registration email flow...');
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Generate test recipient data
    const testName = `Test User ${new Date().getTime()}`;
    const testEmail = `test${new Date().getTime()}@example.com`;
    const testPassword = 'password123';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    console.log(`📝 Creating test recipient request for: ${testName} (${testEmail})`);
    
    // Import the RecipientRequest model
    const RecipientRequest = (await import('./models/recipientRequestModel.js')).default;
    
    // Create a test recipient request
    const request = await RecipientRequest.create({
      name: testName,
      email: testEmail,
      password: hashedPassword,
      status: 'pending',
      emailsSent: {
        confirmation: false,
        verification: false
      }
    });
    
    console.log(`✅ Test recipient request created with ID: ${request._id}`);
    
    // Process confirmation and admin notification emails
    console.log('📧 Processing confirmation and admin notification emails...');
    const confirmationResults = await emailAutomation.processNewRecipientRequest(request);
    
    console.log('📧 Results from confirmation emails:', confirmationResults);
    
    // Process verification email
    console.log('📧 Processing verification email...');
    const verificationResult = await emailAutomation.processVerificationEmail(
      request, 
      "This is a test verification request. Please provide proof of eligibility for our program."
    );
    
    console.log('📧 Verification email sent:', verificationResult ? '✅ Success' : '❌ Failed');
    
    // Check final email status
    const updatedRequest = await RecipientRequest.findById(request._id);
    console.log('📊 Final email status in database:', updatedRequest.emailsSent);
    
    // Clean up - delete the test recipient request
    await RecipientRequest.findByIdAndDelete(request._id);
    console.log('🧹 Test data cleaned up');
    
    // Close database connection
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    
    console.log('✅ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error in test:', error);
    
    // Attempt to close database connection
    try {
      await mongoose.disconnect();
      console.log('👋 Database connection closed after error');
    } catch (disconnectError) {
      console.error('❌ Error closing database connection:', disconnectError);
    }
    
    return false;
  }
}

// Run the test
testRegistrationEmailFlow()
  .then(success => {
    if (success) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('😞 Test failed. Check the error logs above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
