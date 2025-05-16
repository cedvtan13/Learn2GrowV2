// routes/postRoutes.js
import express from 'express';
import Post    from '../models/postModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/posts — list all posts
router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('author', 'name')           // show author name
    .sort({ createdAt: -1 });
  res.json(posts);
});

// POST /api/posts — create a new post (logged-in only)
router.post('/', protect, async (req, res) => {
  const { title, content, targetAmount } = req.body;
  if (!content) return res.status(400).json({ message: 'Content required' });

  const post = await Post.create({
    author:       req.user._id,
    title:        title || '',
    content,
    targetAmount: targetAmount || 0
  });

  // populate author name before returning
  await post.populate('author', 'name');
  res.status(201).json(post);
});

// GET /api/posts/:id — single post
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});

// DELETE /api/posts/:id — author only
router.delete('/:id', protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (!post.author.equals(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await post.remove();
  res.json({ message: 'Deleted' });
});

// PUT /api/posts/:id — author only
router.put('/:id', protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (!post.author.equals(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { title, content, targetAmount } = req.body;
  post.title        = title        ?? post.title;
  post.content      = content      ?? post.content;
  post.targetAmount = targetAmount ?? post.targetAmount;
  await post.save();
  res.json(post);
});

export default router;
