// models/recipientRequestModel.js
import mongoose from 'mongoose';

const recipientRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  notes: { type: String }, // For admin notes
  reviewedBy: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // Track emails that have been sent to this recipient
  emailsSent: {
    confirmation: { type: Boolean, default: false },
    approval: { type: Boolean, default: false },
    verification: { type: Boolean, default: false }
  },
  lastEmailSent: { type: Date },
  lastEmailType: { type: String }
});

export default mongoose.model('RecipientRequest', recipientRequestSchema);
