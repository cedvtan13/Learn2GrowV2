// db.js
import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('.env MONGO_URI is undefined');

  const conn = await mongoose.connect(uri, {
useNewUrlParser:    true,
    useUnifiedTopology: true,
    dbName:             'learn2growV2'
  });
  console.log('✅ MongoDB connected to:', conn.connection.db.databaseName);
  return conn;
}
