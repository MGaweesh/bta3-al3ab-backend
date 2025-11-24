import { MongoClient } from 'mongodb';

let client = null;
let db = null;

// MongoDB connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.log('⚠️  MONGODB_URI not set, using file-based storage');
      return null;
    }

    if (client && db) {
      return db;
    }

    // Connection options for better performance
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    };
    
    client = new MongoClient(uri, options);
    await client.connect();
    // Use database name from URI or default to 'bta3al3ab'
    const dbName = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/)?.[1] || 'bta3al3ab';
    db = client.db(dbName);
    
    console.log(`✅ Connected to MongoDB - Database: ${dbName}`);
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return null;
  }
};

// Get database instance
const getDB = async () => {
  if (!db) {
    await connectDB();
  }
  return db;
};

// Close connection
const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
};

export { connectDB, getDB, closeDB };

