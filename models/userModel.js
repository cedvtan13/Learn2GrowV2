// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },             // hash
  role:        { type: String, enum: ['Sponsor','Recipient','Admin'], required: true },  // user_type :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
  profile: {
    needs:     { type: String, maxlength: 255 },             // recipient_needs :contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}
    verified:  { type: Boolean, default: false },            // verification_status :contentReference[oaicite:6]{index=6}:contentReference[oaicite:7]{index=7}
    qrCodeUrl: { type: String },                             // for GCash QR uploads (posts feature)
  },
  createdAt:   { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
