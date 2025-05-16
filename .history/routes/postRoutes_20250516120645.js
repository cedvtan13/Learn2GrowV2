// routes/postRoutes.js
import express from 'express';
import Post from '../models/postModel.js';
import mongoose from 'mongoose';
import upload from '../middleware/uploadMiddleware.js';
import path from 'path';

const router = express.Router();

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, targetAmount, imageUrl, qrCodeUrl } = req.body;
    const authorId = req.user.userId; // This comes from the auth middleware

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }    // Ensure authorId is a valid MongoDB ObjectId
    let authorObjectId;
    try {
      // If it's already a valid ObjectId string, this will work
      authorObjectId = new mongoose.Types.ObjectId(authorId);
    } catch (error) {
      console.error('Invalid ObjectId format for author:', authorId);
      // Fallback to a default ObjectId if authorId is invalid
      authorObjectId = new mongoose.Types.ObjectId();
    }

    const post = await Post.create({
      title,
      content,
      targetAmount: parseFloat(targetAmount) || 0,
      amountRaised: 0,
      author: authorObjectId,
      imageUrl: imageUrl || null,
      qrCodeUrl: qrCodeUrl || null
    });

    await post.populate('author', 'name email');
    
    return res.status(201).json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Get all posts
 * @route   GET /api/posts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name email');
    
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Get post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);  } catch (err) {
    console.error(err);
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Update a post
 * @route   PUT /api/posts/:id
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, content, targetAmount, imageUrl, qrCodeUrl } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author of the post or an admin
    if (post.author.toString() !== req.user.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    post.title = title || post.title;
    post.content = content || post.content;
    post.targetAmount = targetAmount !== undefined ? parseFloat(targetAmount) : post.targetAmount;
    
    if (imageUrl) post.imageUrl = imageUrl;
    if (qrCodeUrl) post.qrCodeUrl = qrCodeUrl;
    
    const updatedPost = await post.save();
    await updatedPost.populate('author', 'name email');
    
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Add a donation to a post
 * @route   POST /api/posts/:id/donate
 * @access  Private
 */
router.post('/:id/donate', async (req, res) => {
  try {
    const { amount } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Update the amount raised
    post.amountRaised += parseFloat(amount);
    await post.save();
    
    res.json({ 
      success: true, 
      amountRaised: post.amountRaised,
      message: `Successfully added donation of ₱${amount}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });  }
});

/**
 * @desc    Upload image for post
 * @route   POST /api/posts/upload
 * @access  Private
 */
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      fileUrl: fileUrl,
      message: 'File uploaded successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

export default router;
