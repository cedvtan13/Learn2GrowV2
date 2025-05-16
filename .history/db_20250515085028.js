// db.js
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
console.log('🔍 [db.js] MONGO_URI =', uri);

export async function connectDB() {
  try {
    console.log('🔗 [db.js] connecting to Mongo…');
    const conn = await mongoose.connect(uri, {
      // these options are now ignored, but harmless:
      useNewUrlParser:    true,
      useUnifiedTopology: true,
      dbName: 'learn2growV2'
    });
    console.log('✅ MongoDB connected to:', conn.connection.db.databaseName);
    return conn;
  } catch (err) {
    console.error('❌ connectDB error:', err);
    process.exit(1);
  }
}
