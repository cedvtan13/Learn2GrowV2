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
        console.log('GET /conversations - User:', req.user);
        // Get userId from either _id or userId field, depending on how authMiddleware sets it
        const userId = req.user._id || req.user.userId;
        
        // Check if userId is a valid MongoDB ObjectId and convert if necessary
        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
        } catch (error) {
            console.error('Invalid ObjectId format for user:', userId);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Find all messages where the current user is either sender or receiver
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { from: userObjectId },
                        { to: userObjectId }
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
                            { $eq: ["$from", userObjectId] },
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
router.get('/:userId', protect, async (req, res) => {    try {
        const currentUserId = req.user._id || req.user.userId;
        const otherUserId = req.params.userId;

        // Convert IDs to ObjectId
        let currentUserObjectId, otherUserObjectId;
        try {
            currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
            otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);
        } catch (error) {
            console.error('Invalid ObjectId format:', error);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Validate user exists
        const userExists = await User.findById(otherUserObjectId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find messages between the two users
        const messages = await Message.find({
            $or: [
                { from: currentUserObjectId, to: otherUserObjectId },
                { from: otherUserObjectId, to: currentUserObjectId }
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
router.post('/:userId', protect, async (req, res) => {    try {
        const from = req.user._id || req.user.userId;
        const to = req.params.userId;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Convert IDs to ObjectId
        let fromObjectId, toObjectId;
        try {
            fromObjectId = new mongoose.Types.ObjectId(from);
            toObjectId = new mongoose.Types.ObjectId(to);
        } catch (error) {
            console.error('Invalid ObjectId format:', error);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Validate recipient exists
        const recipient = await User.findById(toObjectId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }        // Create and save the message
        const newMessage = new Message({
            from: fromObjectId,
            to: toObjectId,
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
