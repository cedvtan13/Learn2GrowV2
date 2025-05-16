// models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author:      { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, default: '' },
  content:     { type: String, required: true },
  targetAmount:{ type: Number, min: 1 },
  amountRaised:{ type: Number, default: 0 },
  imageUrl:    { type: String },
  qrCodeUrl:   { type: String },
  likes:       { type: Number, default: 0 },
  likedBy:     [{ type: String }],  // store emails or ObjectIds
  comments: [{
    authorEmail: String,
    content:     String,
    date:        { type: Date, default: Date.now }
  }],
  createdAt:   { type: Date, default: Date.now },
});

postSchema.index({ author: 1, createdAt: -1 });
export default mongoose.model('Post', postSchema);
