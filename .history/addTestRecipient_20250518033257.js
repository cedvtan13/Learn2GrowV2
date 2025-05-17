// addTestRecipient.js
// Script to add a test recipient and trigger the email workflow
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Parse command line arguments
const args = process.argv.slice(2);
const nameArg = args.find(arg => arg.startsWith('--name='));
const emailArg = args.find(arg => arg.startsWith('--email='));
const passwordArg = args.find(arg => arg.startsWith('--password='));

// Extract values or use defaults
const name = nameArg ? nameArg.split('=')[1] : `Test User ${new Date().getTime()}`;
const email = emailArg ? emailArg.split('=')[1] : `test${new Date().getTime()}@example.com`;
const password = passwordArg ? passwordArg.split('=')[1] : 'password123';

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

// Main function
async function addTestRecipient() {
  console.log('🚀 Adding test recipient...');
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to database, exiting...');
      process.exit(1);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log(`📝 Creating recipient request for: ${name} (${email})`);
    
    // Import the RecipientRequest model
    const RecipientRequest = (await import('./models/recipientRequestModel.js')).default;
    
    // Create a test recipient request
    const request = await RecipientRequest.create({
      name,
      email,
      password: hashedPassword,
      status: 'pending',
      emailsSent: {
        confirmation: false,
        verification: false
      }
    });
    
    console.log(`✅ Recipient request created with ID: ${request._id}`);
    
    // Import and use the email automation system
    const emailAutomationModule = await import('./utils/emailAutomation.js');
    const emailAutomation = emailAutomationModule.default;
    
    // Process confirmation and admin notification emails
    console.log('📧 Processing confirmation and admin notification emails...');
    const confirmationResults = await emailAutomation.processNewRecipientRequest(request);
    
    // Process verification email
    console.log('📧 Processing verification email...');
    const verificationResult = await emailAutomation.processVerificationEmail(
      request, 
      "This is a test verification request. Please provide proof of eligibility for our program."
    );
    
    // Print results
    console.log('\n📊 Results Summary:');
    console.log(`✉️ Admin notification: ${confirmationResults.adminNotification ? '✅ Sent' : '❌ Failed'}`);
    console.log(`✉️ User confirmation: ${confirmationResults.confirmation ? '✅ Sent' : '❌ Failed'}`);
    console.log(`✉️ Verification email: ${verificationResult ? '✅ Sent' : '❌ Failed'}`);
    
    // Close database connection
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    
    console.log('✅ Test recipient added successfully!');
    console.log(`📧 Check ${email} for confirmation and verification emails.`);
    console.log(`📧 Check ${process.env.ADMIN_EMAIL} for admin notification.`);
    
  } catch (error) {
    console.error('❌ Error adding test recipient:', error);
    
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
addTestRecipient();
