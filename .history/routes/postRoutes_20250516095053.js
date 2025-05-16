// routes/postRoutes.js
import express from 'express';
import Post    from '../models/postModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/posts
 * @desc    List all posts (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('❌ GET /api/posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, async (req, res) => {
  const { title, content, targetAmount } = req.body;
  if (!title || !content) {
    return res
      .status(400)
      .json({ message: 'Title and content are required' });
  }
  try {
    const post = await Post.create({
      title,
      content,
      targetAmount: Number(targetAmount) || 0,
      author: req.user._id,
    });
    const fullPost = await post
      .populate('author', 'name email')
    res.status(201).json(fullPost);
  } catch (err) {
    console.error('❌ POST /api/posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
