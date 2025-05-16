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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, targetAmount } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.create({
      author:       req.user._id,
      title:        title || '',
      content,
      targetAmount: targetAmount || 0
    });

    // populate author before returning
    await post.populate('author', 'name');
    res.status(201).json(post);
  } catch (err) {
    console.error('❌ POST /api/posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
