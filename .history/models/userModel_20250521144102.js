// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },             // hash
  role:        { type: String, enum: ['Sponsor','Recipient','Admin'], required: true },  // user_type
  profile: {
    needs:     { type: String, maxlength: 255 },             // recipient_needs
    qrCodeUrl: { type: String },                             // for GCash QR uploads (posts feature)
  },
  resetToken:       { type: String },
  resetTokenExpiry: { type: Date },
  createdAt:   { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
