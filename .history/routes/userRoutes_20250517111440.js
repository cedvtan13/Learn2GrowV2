// routes/userRoutes.js

import jwt      from 'jsonwebtoken';
import express  from 'express';
import bcrypt   from 'bcryptjs';
import User     from '../models/userModel.js';  // import the User model
import { protect } from '../middleware/authMiddleware.js';

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      
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
        process.env.JWT_SECRET,
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
