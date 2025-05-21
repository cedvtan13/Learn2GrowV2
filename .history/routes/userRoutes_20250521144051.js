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
    console.log("Created user document:", user);

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

/**
 * @desc    Check if email exists and generate reset token
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if user exists with this email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Generate a reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '1h' }
    );
    
    // Store the reset token in the user's document with an expiry
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a production environment, you would send an email with a link containing the token
    // For now, just return success to indicate the email was found and token generated
    return res.status(200).json({ 
      message: 'Password reset instructions have been sent to your email.',
      // Return the token for testing purposes - remove in production
      resetToken: resetToken
    });
  } catch (err) {
    console.error('Error in forgot password:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users  return all users (omit passwords)
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

/**
 * @desc    Reset password with token
 * @route   POST /api/users/reset-password
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required.' });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Find the user with this token and ensure it hasn't expired
    const user = await User.findOne({
      _id: decoded.userId,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's password and clear the reset token fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Error in reset password:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Handle recipient registration requests
router.post('/request-recipient', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Log the request
    console.log("New Recipient registration request received");
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    try {
      // Import the models and services
      const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
      const resendEmailService = (await import('../utils/resendEmailService.js')).default;
      
      // Check if user exists
      const exists = await User.findOne({ email });
      if (exists) {
        // Send email notification for existing user
        await resendEmailService.sendExistingUserEmail(name, email);
        return res.status(400).json({ message: 'Email already in use. We sent an email with further instructions.' });
      }
      
      // Store the request
      const request = await RecipientRequest.create({
        name,
        email,
        password: hashedPassword,
        status: 'pending'
      });
      
      console.log("Recipient request stored with ID:", request._id);
      
      // Send verification email to user
      await resendEmailService.sendNewRecipientVerificationEmail(name, email);
      
      // Send notification email to admin
      await resendEmailService.sendRecipientRequestToAdmin(name, email);
      
    } catch (storageError) {
      console.error('Error storing recipient request or sending email:', storageError);
      // Even if storage fails, return success to user but log the error
    }
    
    return res.status(200).json({ 
      message: 'Registration request received. Please check your email for verification details.' 
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
    
    // Import the RecipientRequest model and email service
    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    const resendEmailService = (await import('../utils/resendEmailService.js')).default;
    
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
      console.log("New Recipient user created");
      
      // Send approval email
      await resendEmailService.sendRecipientApproval(request.name, request.email);
    } else {
      // Send rejection email
      await resendEmailService.sendRecipientRejection(request.name, request.email, notes);
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

export default router;
