// routes/userRoutes.js

import jwt      from 'jsonwebtoken';
import express  from 'express';
import bcrypt   from 'bcryptjs';
import User     from '../models/userModel.js';  // import the User model
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || 'Recipient'
    });
    console.log('✅ Created user document:', user);

    const { _id, role: userRole } = user;
    return res.status(201).json({ 
      _id, 
      name, 
      email, 
      role: userRole 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users — return all users (omit passwords)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email & password required.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key', // Added fallback to match authMiddleware
    { expiresIn: '24h' }  // Increased to 24 hours for development
  );

  res.json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token  
  });
});

// Get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    // User is already authenticated by protect middleware
    // Return user data from req.user
    res.json(req.user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle recipient registration requests
router.post('/request-recipient', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Log the request
    console.log(`🔔 New Recipient registration request received: ${name} (${email})`);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
      try {
      // Import the RecipientRequest model
      const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
        // Store the request
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
      
      console.log(`✅ Recipient request stored with ID: ${request._id}`);
        // Use the emailAutomation system for better tracking
      const emailAutomationModule = await import('../utils/emailAutomation.js');
      const emailAutomation = emailAutomationModule.default;
      
      // Process emails for the new request (confirmation and admin notification)
      const emailResults = await emailAutomation.processNewRecipientRequest(request);
      
      // Also send verification email immediately
      const verificationResult = await emailAutomation.processVerificationEmail(request, 
        "Please provide documentation to verify your eligibility for our program.");
      
      console.log(`✉️ Confirmation/notification emails processed for ${name} (${email}):`, emailResults);
      console.log(`📨 Verification email sent to ${name} (${email}): ${verificationResult ? '✅ Sent' : '❌ Failed'}`);
    } catch (storageError) {
      console.error('Error storing recipient request:', storageError);
      // Even if storage fails, return success to user but log the error
    }
    
    return res.status(200).json({ 
      message: 'Registration request received. Our team will review your application and contact you shortly.' 
    });
  } catch (err) {
    console.error('Error processing recipient request:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all recipient requests (admin only)
router.get('/recipient-requests', protect, admin, async (req, res) => {
  try {
    // Import the RecipientRequest model
    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    
    // Get all requests, newest first
    const requests = await RecipientRequest.find()
      .sort({ createdAt: -1 })
      .select('-password'); // Don't send password hashes
    
    res.json(requests);
  } catch (err) {
    console.error('Error getting recipient requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject a recipient request (admin only)
router.put('/recipient-requests/:id', protect, admin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either approved or rejected' });
    }
    
    // Import the RecipientRequest model
    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    
    // Find the request
    const request = await RecipientRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
      // If approving, create a new user
    if (status === 'approved') {
      const user = await User.create({
        name: request.name,
        email: request.email,
        password: request.password, // Already hashed
        role: 'Recipient'
      });
      
      console.log(`✅ New Recipient user created: ${user._id}`);
        
      // Send approval email using emailAutomation for better tracking
      try {
        const emailAutomationModule = await import('../utils/emailAutomation.js');
        const emailAutomation = emailAutomationModule.default;
        await emailAutomation.processApprovalEmail(request);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    } else if (status === 'rejected') {      
      // Send verification email using emailAutomation for better tracking
      try {
        const emailAutomationModule = await import('../utils/emailAutomation.js');
        const emailAutomation = emailAutomationModule.default;
        await emailAutomation.processVerificationEmail(request, notes);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
      }
    }
    
    // Update request status
    request.status = status;
    request.notes = notes;
    request.reviewedBy = req.user.userId;
    request.reviewedAt = new Date();
    await request.save();
    
    res.json({
      message: `Recipient request ${status}`,
      request: {
        _id: request._id,
        name: request.name,
        email: request.email,
        status: request.status
      }
    });
  } catch (err) {
    console.error('Error updating recipient request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
      try {
      // First try to decode and verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key', { ignoreExpiration: true });
      
      // Get the user ID from the token
      const { userId, role } = decoded;
      
      // Check if user still exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
        // Generate a new token
      const newToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'dev-secret-key', // Added fallback to match authMiddleware
        { expiresIn: '24h' }
      );
      
      // Return the new token
      return res.json({ token: newToken });
    } catch (error) {
      console.error('Error refreshing token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error('Server error when refreshing token:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (for messaging/profile view)
router.get('/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find user by ID and exclude sensitive data
    const user = await User.findById(userId)
      .select('_id name email profile role createdAt')
      .lean();
      if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data
    res.json(user);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test email functionality
router.post('/test-email', protect, admin, async (req, res) => {
  try {
    const { emailType } = req.body;
    const testName = 'Test User';
    const testEmail = req.body.email || req.user.email || 'test@example.com';
    const testNotes = 'This is a test message from the Learn2Grow platform.';
    
    console.log(`📧 Attempting to send test ${emailType} email to ${testEmail}`);
    
    const emailServiceModule = await import('../utils/emailService.js');
    const emailService = emailServiceModule.default;
    
    let result = false;
    
    switch(emailType) {
      case 'request':
        result = await Promise.all([
          emailService.sendRecipientRequestToAdmin(testName, testEmail),
          emailService.sendRecipientConfirmation(testName, testEmail)
        ]);
        break;
      case 'approval':
        result = await emailService.sendRecipientApproval(testName, testEmail);
        break;
      case 'verification':
        result = await emailService.sendRecipientVerification(testName, testEmail, testNotes);
        break;
      default:
        return res.status(400).json({ message: 'Invalid email type. Use "request", "approval", or "verification".' });
    }
    
    if (result) {
      console.log(`✅ Test email(s) for "${emailType}" sent successfully`);
      return res.json({ message: `Test ${emailType} email(s) sent to ${testEmail}` });
    } else {
      console.error('❌ Failed to send test email');
      return res.status(500).json({ message: 'Failed to send test email' });
    }
  } catch (err) {
    console.error('Error sending test email:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Process pending emails manually (admin only)
router.post('/process-pending-emails', protect, admin, async (req, res) => {
  try {
    console.log('🔄 Manual trigger for processing pending emails');
    
    // Import emailAutomation
    const emailAutomationModule = await import('../utils/emailAutomation.js');
    const emailAutomation = emailAutomationModule.default;
    
    // Process all pending emails
    const results = await emailAutomation.processPendingEmails();
    
    return res.json({
      message: 'Email processing completed',
      results
    });
  } catch (err) {
    console.error('Error processing pending emails:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
