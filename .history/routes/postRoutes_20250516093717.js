// routes/postRoutes.js
import express from 'express'
import Post from '../models/postModel.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// … your GET handler …

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, async (req, res) => {
  // --- DEBUG: are we getting a body & a user? ---
  console.log('🛰️  POST /api/posts  body:', req.body)
  console.log('🛰️  POST /api/posts  user:', req.user && req.user._id)

  const { title, content, targetAmount } = req.body
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' })
  }

  try {
    // create & save the Post document
    const post = new Post({
      title,
      content,
      targetAmount: Number(targetAmount) || 0,
      author: req.user._id
    })
    await post.save()

    // populate the author before sending back
    const fullPost = await post.populate('author', 'name email').execPopulate();

    console.log('✅  New post created:', fullPost)
    res.status(201).json(fullPost)

  } catch (err) {
    console.error('❌  POST /api/posts error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
