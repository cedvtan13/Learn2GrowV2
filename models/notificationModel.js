// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Types.ObjectId, ref: 'User', required: true }, 
  type:      { type: String, enum: ['System','Transaction','Reminder'], default: 'System' }, // notification_type :contentReference[oaicite:32]{index=32}:contentReference[oaicite:33]{index=33}
  message:   { type: String },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ user: 1, read: 1 });
export default mongoose.model('Notification', notificationSchema);
