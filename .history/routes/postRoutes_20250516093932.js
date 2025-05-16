// routes/postRoutes.js
import express from 'express';
import Post from '../models/postModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts, newest first
// @access  Public
router.get('/', async (req, res) => {
  try {
    // ——— DEBUG LOGGING ———
    const allPosts = await Post.find()
      .populate('author', 'name email');
    console.log(
      '🔎 [GET /api/posts] found',
      allPosts.length,
      'posts in DB'
    );
    // Optionally inspect the array structure:
    // console.dir(allPosts, { depth: 1 });
    // ————————————————

    // now sort newest-first and return
    const posts = allPosts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
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
