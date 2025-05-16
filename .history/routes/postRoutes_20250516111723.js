// routes/postRoutes.js
import express from 'express';
import Post from '../models/postModel.js';
import mongoose from 'mongoose';

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
    }

    const post = await Post.create({
      title,
      content,
      targetAmount: parseFloat(targetAmount) || 0,
      amountRaised: 0,
      author: authorId,
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
    
    res.json(post);
  } catch (err) {
    console.error(err);
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
