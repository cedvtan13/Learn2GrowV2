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

    try {      // Import the email service
      const { sendPasswordResetEmail } = await import('../utils/emailJSService.js');
      
      // Send password reset email
      await sendPasswordResetEmail(user.name, user.email, resetToken);
      
      return res.status(200).json({ 
        message: 'Password reset instructions have been sent to your email.',
        // For development purposes, return the token directly
        ...(process.env.NODE_ENV !== 'production' && { resetToken })
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Even if email fails, return success to the user
      // This prevents email enumeration attacks
      return res.status(200).json({ 
        message: 'If your email exists in our system, password reset instructions have been sent.',
        // For development purposes, return the token directly
        ...(process.env.NODE_ENV !== 'production' && { resetToken })
      });
    }
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

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }    // Import RecipientRequest model
    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    const User = (await import('../models/userModel.js')).default;
    // Use emailJSService for notifications to ensure delivery
    const { sendRecipientRequestToAdmin, sendRecipientApproval } = await import('../utils/emailJSService.js');

    // Find the recipient request with this token and ensure it hasn't expired
    const request = await RecipientRequest.findOne({
      email: decoded.email,
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!request) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    // Update the request to mark email as verified and automatically approve
    request.isEmailVerified = true;
    request.status = 'approved';
    request.verificationToken = null;
    request.verificationTokenExpiry = null;
    await request.save();
    
    // Create new user from approved request
    const newUser = new User({
      name: request.name,
      email: request.email,
      password: request.password,
      role: 'Recipient'
    });
    
    await newUser.save();
    
    // Send notifications
    const adminNotification = await sendRecipientRequestToAdmin(request.name, request.email);
    console.log("Admin notification sent:", adminNotification);
    
    // Also send approval email to the recipient
    const approvalNotification = await sendRecipientApproval(request.name, request.email);
    console.log("Approval notification sent:", approvalNotification);

    // Redirect to a confirmation page or login page
    return res.redirect('/verification-success.html');
  } catch (err) {
    console.error('Error in email verification:', err);
    return res.status(500).json({ message: 'Server error' });
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
      try {      // Import the models and services
      const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
        // Import email services from emailJSService
      const { sendNewRecipientVerificationEmail, sendExistingUserEmail } = await import('../utils/emailJSService.js');
      
      // Check if user exists
      const exists = await User.findOne({ email });
      if (exists) {
        // Send email notification for existing user
        await sendExistingUserEmail(name, email);
        return res.status(400).json({ message: 'Email already in use. We sent an email with further instructions.' });
      }
      
      // Generate a verification token (valid for 24 hours)
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '24h' }
      );
      
      // Store the request with verification token
      const request = await RecipientRequest.create({
        name,
        email,
        password: hashedPassword,
        status: 'pending',
        verificationToken,
        verificationTokenExpiry: Date.now() + 86400000 // 24 hours
      });
      
      console.log("Recipient request stored with ID:", request._id);
      // Send verification email to user with token
      console.log('Sending verification email with token:', verificationToken.substring(0, 20) + '...');
      
      // Make sure we pass all necessary parameters including the verification token
      const emailResult = await sendNewRecipientVerificationEmail(name, email, verificationToken);
      console.log("Verification email sent:", emailResult);
      
      // Don't send admin notification until email is verified
      // Admin notification will be sent after verification
      
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
    
    // Get all requests that have verified emails, newest first
    const requests = await RecipientRequest.find({ 
      isEmailVerified: true 
    })
      .sort({ createdAt: -1 })
      .select('-password -verificationToken -verificationTokenExpiry'); // Don't send sensitive data
    
    res.json(requests);
  } catch (err) {
    console.error('Error getting recipient requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    // Get all users, excluding sensitive information
    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(users);
  } catch (err) {
    console.error('Error getting users:', err);
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
    const { sendRecipientApproval, sendRecipientRejection } = await import('../utils/emailJSService.js');
      // Find the request
    const request = await RecipientRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Check if email is verified
    if (!request.isEmailVerified) {
      return res.status(400).json({ message: 'Email not verified. User must verify email before approval/rejection.' });
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
      await sendRecipientApproval(request.name, request.email);
    } else {      // Send rejection email
      await sendRecipientRejection(request.name, request.email, notes);
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

/**
 * @desc    Update user profile (name and profile picture)
 * @route   PUT /api/users/profile/update
 * @access  Private
 */
router.put('/profile/update', protect, async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from auth middleware
    const { name, profilePicture } = req.body;
    
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user data
    if (name) user.name = name;
    if (profilePicture) {
      // If profile doesn't exist, create it
      if (!user.profile) user.profile = {};
      user.profile.profilePicture = profilePicture;
    }
    
    // Save the updated user
    const updatedUser = await user.save();
    
    // Return updated user without sensitive data
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:userId', protect, admin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.userId;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate role
    if (!['Sponsor', 'Recipient', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user data
    user.name = name;
    user.email = email;
    user.role = role;

    await user.save();

    // Return updated user without sensitive data
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:userId', protect, admin, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Change user password
 * @route   POST /api/users/change-password
 * @access  Private
 */
router.post('/change-password', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
