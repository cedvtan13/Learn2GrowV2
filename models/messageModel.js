// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from:      { type: mongoose.Types.ObjectId, ref: 'User', required: true }, // sender
  to:        { type: mongoose.Types.ObjectId, ref: 'User', required: true }, // receiver
  content:   { type: String, maxlength: 1000 },                             // message_content :contentReference[oaicite:28]{index=28}:contentReference[oaicite:29]{index=29}
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ to: 1, from: 1, createdAt: -1 });
export default mongoose.model('Message', messageSchema);
