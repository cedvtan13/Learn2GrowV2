import 'dotenv/config';
import mongoose from 'mongoose';

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ test.js connected!'))
  .catch(err => console.error('❌ test.js error:', err))
  .finally(() => process.exit());
