// models/postModel.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    default: 0
  },
  amountRaised: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',                // assumes your userModel is exported as 'User'
    required: true
  }
}, {
  timestamps: true
});

const Post = mongoose.model('Post', postSchema);
export default Post;
