// models/Donation.js
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  sponsor:    { type: mongoose.Types.ObjectId, ref: 'User', required: true },   // sponsor_id :contentReference[oaicite:10]{index=10}:contentReference[oaicite:11]{index=11}
  recipient:  { type: mongoose.Types.ObjectId, ref: 'User', required: true },   // recipient_id :contentReference[oaicite:12]{index=12}:contentReference[oaicite:13]{index=13}
  type:       { type: String, enum: ['Monetary','Goods','Both'], required: true },  // donation_type :contentReference[oaicite:14]{index=14}:contentReference[oaicite:15]{index=15}
  amount:     { type: Number, min: 1 },                                          // amount :contentReference[oaicite:16]{index=16}:contentReference[oaicite:17]{index=17}
  goodsDesc:  { type: String, maxlength: 255 },                                  // goods_description :contentReference[oaicite:18]{index=18}:contentReference[oaicite:19]{index=19}
  status:     { type: String, enum: ['Pending','Approved','Rejected','Error','Distributed'], default: 'Pending' }, // donation_status :contentReference[oaicite:20]{index=20}:contentReference[oaicite:21]{index=21}
  createdAt:  { type: Date, default: Date.now },                                 // transaction_date :contentReference[oaicite:22]{index=22}:contentReference[oaicite:23]{index=23}
});

donationSchema.index({ sponsor: 1, status: 1 });  // filter by sponsor & status
export default mongoose.model('Donation', donationSchema);
