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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (author only)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, content, targetAmount } = req.body;
    post.title        = title ?? post.title;
    post.content      = content ?? post.content;
    post.targetAmount = targetAmount ?? post.targetAmount;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (author only)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await post.remove();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
