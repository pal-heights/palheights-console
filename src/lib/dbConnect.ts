import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

// Global is used here to maintain a cached connection across hot reloads in development and across invocations in serverless
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const dbConnect = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      // Add any mongoose options here if needed
    }).then((mongoose) => {
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch((err) => {
      console.error('❌ DB connection failed:', err);
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};
