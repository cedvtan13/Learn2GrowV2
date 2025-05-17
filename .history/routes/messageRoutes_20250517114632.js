// routes/messageRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all conversations for the current user
router.get('/conversations', protect, async (req, res) => {
    try {
        // Get userId from either _id or userId field, depending on how authMiddleware sets it
        const userId = req.user._id || req.user.userId;

        // Find all messages where the current user is either sender or receiver
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { from: mongoose.Types.ObjectId(userId) },
                        { to: mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            // Sort by creation date descending
            { $sort: { createdAt: -1 } },
            // Group by the other user in conversation
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$from", mongoose.Types.ObjectId(userId)] },
                            "$to", // If user is sender, group by receiver
                            "$from" // If user is receiver, group by sender
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            // Lookup the other user's details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "otherUser"
                }
            },
            // Project only needed fields
            {
                $project: {
                    _id: 1,
                    otherUser: { $arrayElemAt: ["$otherUser", 0] },
                    lastMessage: 1
                }
            },
            // Project specific user fields to avoid sending sensitive data
            {
                $project: {
                    _id: 1,
                    "otherUser._id": 1,
                    "otherUser.name": 1,
                    "otherUser.profile.avatar": 1,
                    "lastMessage.content": 1,
                    "lastMessage.createdAt": 1
                }
            }
        ]);

        res.json(messages);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get conversation history with a specific user
router.get('/:userId', protect, async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.userId;
        const otherUserId = req.params.userId;

        // Validate user exists
        const userExists = await User.findById(otherUserId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find messages between the two users
        const messages = await Message.find({
            $or: [
                { from: currentUserId, to: otherUserId },
                { from: otherUserId, to: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .select('from to content createdAt');

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message to a user
router.post('/:userId', protect, async (req, res) => {
    try {
        const from = req.user._id || req.user.userId;
        const to = req.params.userId;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Validate recipient exists
        const recipient = await User.findById(to);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Create and save the message
        const newMessage = new Message({
            from,
            to,
            content
        });

        const savedMessage = await newMessage.save();

        // Return the new message
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });    }
});

// Search for users to message
router.get('/search/users', protect, async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user._id || req.user.userId;
        
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        // Search for users whose name or email contains the query string
        // Exclude the current user and sensitive fields
        const users = await User.find({
            _id: { $ne: currentUserId },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
        .select('_id name profile.avatar role')
        .limit(10);
        
        res.json(users);
    } catch (error) {
        console.error('Error searching for users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
